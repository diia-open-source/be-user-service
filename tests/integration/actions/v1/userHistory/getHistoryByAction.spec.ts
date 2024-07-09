import { IdentifierService } from '@diia-inhouse/crypto'
import { FilterQuery, UpdateQuery } from '@diia-inhouse/db'
import { UserSession } from '@diia-inhouse/types'

import GetHistoryByActionAction from '@actions/v1/userHistory/getHistoryByAction'

import DocumentsService from '@services/documents'

import userSharingHistoryItemModel from '@models/userSharingHistoryItem'
import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'

import AcquirersSharingStatusEventMock from '@mocks/eventListeners/acquirersSharingStatus'
import AcquirersSigningStatusEventMock from '@mocks/eventListeners/acquirersSigningStatus'

import SessionGenerator from '@tests/mocks/sessionGenerator'
import { getApp } from '@tests/utils/getApp'

import { UserSharingHistoryItem, UserSharingHistoryItemModel } from '@interfaces/models/userSharingHistoryItem'
import { UserSigningHistoryItem, UserSigningHistoryItemModel } from '@interfaces/models/userSigningHistoryItem'
import { HistoryAction, HistoryItem, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryByActionAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getHistoryByActionAction: GetHistoryByActionAction
    let acquirersSharingStatusEventMock: AcquirersSharingStatusEventMock
    let acquirersSigningStatusEventMock: AcquirersSigningStatusEventMock
    let userHistoryDataMapper: UserHistoryDataMapper
    let identifier: IdentifierService
    let sessionGenerator: SessionGenerator

    beforeAll(async () => {
        app = await getApp()

        getHistoryByActionAction = app.container.build(GetHistoryByActionAction)
        acquirersSharingStatusEventMock = app.container.build(AcquirersSharingStatusEventMock)
        acquirersSigningStatusEventMock = app.container.build(AcquirersSigningStatusEventMock)
        userHistoryDataMapper = app.container.build(UserHistoryDataMapper)
        identifier = app.container.resolve('identifier')!
        sessionGenerator = new SessionGenerator(identifier)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it(`should return ${HistoryAction.Sharing} processing items`, async () => {
        const session: UserSession = sessionGenerator.getUserSession()
        const headers = sessionGenerator.getHeaders()

        const { sharingId, acquirer } = await acquirersSharingStatusEventMock.handle(session, headers, UserHistoryItemStatus.Processing)

        jest.spyOn(app.container.resolve<DocumentsService>('documentsService'), 'getDocumentNames').mockResolvedValueOnce([
            'driver-license-name',
        ])
        const { total, history } = await getHistoryByActionAction.handler({ params: { action: HistoryAction.Sharing }, session, headers })
        const [item]: HistoryItem[] = history

        expect(total).toBe(1)
        expect(item).toEqual<HistoryItem>({
            id: sharingId,
            status: UserHistoryItemStatus.Processing,
            recipient: { name: acquirer.name, address: acquirer.address },
            date: expect.any(String),
            documents: ['driver-license-name'],
        })

        const query: FilterQuery<UserSharingHistoryItemModel> = { sharingId }
        const record = await userSharingHistoryItemModel.findOneAndDelete(query).lean()

        expect(record).toMatchObject<UserSharingHistoryItem>({
            userIdentifier: session.user.identifier,
            sessionId: identifier.createIdentifier(headers.mobileUid),
            sharingId,
            status: UserHistoryItemStatus.Processing,
            statusHistory: [{ status: UserHistoryItemStatus.Processing, date: expect.any(Date) }],
            documents: [],
            date: expect.any(Date),
            acquirer,
        })
    })

    it(`should return ${HistoryAction.Signing} items`, async () => {
        const session: UserSession = sessionGenerator.getUserSession()
        const headers = sessionGenerator.getHeaders()

        const { resourceId, acquirer, offer } = await acquirersSigningStatusEventMock.handle(
            session,
            headers,
            UserHistoryItemStatus.Processing,
        )

        const { total, history } = await getHistoryByActionAction.handler({ params: { action: HistoryAction.Signing }, session, headers })
        const [item]: HistoryItem[] = history

        expect(total).toBe(1)
        expect(item).toEqual<HistoryItem>({
            id: resourceId,
            status: UserHistoryItemStatus.Processing,
            recipient: { name: acquirer.name, address: acquirer.address },
            date: expect.any(String),
            documents: expect.any(Array),
            purpose: offer.name,
        })

        const query: FilterQuery<UserSigningHistoryItemModel> = { resourceId }
        const record = await userSigningHistoryItemModel.findOneAndDelete(query).lean()

        expect(record).toMatchObject<UserSigningHistoryItem>({
            userIdentifier: session.user.identifier,
            sessionId: identifier.createIdentifier(headers.mobileUid),
            resourceId,
            status: UserHistoryItemStatus.Processing,
            statusHistory: [{ status: UserHistoryItemStatus.Processing, date: expect.any(Date) }],
            documents: [],
            date: expect.any(Date),
            acquirer,
            offer,
        })
    })

    it(`should return refused ${HistoryAction.Sharing} items if the processing threshold has passed`, async () => {
        const session: UserSession = sessionGenerator.getUserSession()
        const headers = sessionGenerator.getHeaders()

        const { sharingId, acquirer } = await acquirersSharingStatusEventMock.handle(session, headers, UserHistoryItemStatus.Processing)

        const query: FilterQuery<UserSharingHistoryItemModel> = { sharingId }
        const updatedDate: Date = new Date(Date.now() - userHistoryDataMapper.failHistoryItemThreshold)
        const modifier: UpdateQuery<UserSharingHistoryItemModel> = {
            statusHistory: [{ status: UserHistoryItemStatus.Processing, date: updatedDate }],
        }

        await userSharingHistoryItemModel.updateOne(query, modifier)
        jest.spyOn(app.container.resolve<DocumentsService>('documentsService'), 'getDocumentNames').mockResolvedValueOnce([
            'driver-license-name',
        ])

        const { total, history } = await getHistoryByActionAction.handler({ params: { action: HistoryAction.Sharing }, session, headers })
        const [item]: HistoryItem[] = history

        expect(total).toBe(1)
        expect(item).toEqual<HistoryItem>({
            id: sharingId,
            status: UserHistoryItemStatus.Refuse,
            recipient: { name: acquirer.name, address: acquirer.address },
            date: expect.any(String),
            documents: ['driver-license-name'],
        })

        const record = await userSharingHistoryItemModel.findOneAndDelete(query).lean()

        expect(record).toMatchObject<UserSharingHistoryItem>({
            userIdentifier: session.user.identifier,
            sessionId: identifier.createIdentifier(headers.mobileUid),
            sharingId,
            status: UserHistoryItemStatus.Processing,
            statusHistory: [{ status: UserHistoryItemStatus.Processing, date: updatedDate }],
            documents: [],
            date: expect.any(Date),
            acquirer,
        })
    })

    it(`should return refused ${HistoryAction.Signing} items if the processing threshold has passed`, async () => {
        const session: UserSession = sessionGenerator.getUserSession()
        const headers = sessionGenerator.getHeaders()

        const { resourceId, acquirer, offer } = await acquirersSigningStatusEventMock.handle(
            session,
            headers,
            UserHistoryItemStatus.Processing,
        )

        const query: FilterQuery<UserSigningHistoryItemModel> = { resourceId }
        const updatedDate: Date = new Date(Date.now() - userHistoryDataMapper.failHistoryItemThreshold)
        const modifier: UpdateQuery<UserSigningHistoryItemModel> = {
            statusHistory: [{ status: UserHistoryItemStatus.Processing, date: updatedDate }],
        }

        await userSigningHistoryItemModel.updateOne(query, modifier)

        const { total, history } = await getHistoryByActionAction.handler({ params: { action: HistoryAction.Signing }, session, headers })
        const [item]: HistoryItem[] = history

        expect(total).toBe(1)
        expect(item).toEqual<HistoryItem>({
            id: resourceId,
            status: UserHistoryItemStatus.Refuse,
            recipient: { name: acquirer.name, address: acquirer.address },
            date: expect.any(String),
            documents: expect.any(Array),
            purpose: offer.name,
        })

        const record = await userSigningHistoryItemModel.findOneAndDelete(query).lean()

        expect(record).toMatchObject<UserSigningHistoryItem>({
            userIdentifier: session.user.identifier,
            sessionId: identifier.createIdentifier(headers.mobileUid),
            resourceId,
            status: UserHistoryItemStatus.Processing,
            statusHistory: [{ status: UserHistoryItemStatus.Processing, date: updatedDate }],
            documents: [],
            date: expect.any(Date),
            acquirer,
            offer,
        })
    })

    it(`should still return done ${HistoryAction.Sharing} items if the processing threshold has passed`, async () => {
        const session: UserSession = sessionGenerator.getUserSession()
        const headers = sessionGenerator.getHeaders()

        const { sharingId, acquirer } = await acquirersSharingStatusEventMock.handle(session, headers, UserHistoryItemStatus.Done)

        const query: FilterQuery<UserSharingHistoryItemModel> = { sharingId }
        const updatedDate: Date = new Date(Date.now() - userHistoryDataMapper.failHistoryItemThreshold)
        const modifier: UpdateQuery<UserSharingHistoryItemModel> = {
            statusHistory: [{ status: UserHistoryItemStatus.Done, date: updatedDate }],
        }

        await userSharingHistoryItemModel.updateOne(query, modifier)
        jest.spyOn(app.container.resolve<DocumentsService>('documentsService'), 'getDocumentNames').mockResolvedValueOnce([
            'driver-license-name',
        ])

        const { total, history } = await getHistoryByActionAction.handler({ params: { action: HistoryAction.Sharing }, session, headers })
        const [item]: HistoryItem[] = history

        expect(total).toBe(1)
        expect(item).toEqual<HistoryItem>({
            id: sharingId,
            status: UserHistoryItemStatus.Done,
            recipient: { name: acquirer.name, address: acquirer.address },
            date: expect.any(String),
            documents: ['driver-license-name'],
        })

        const record = await userSharingHistoryItemModel.findOneAndDelete(query).lean()

        expect(record).toMatchObject<UserSharingHistoryItem>({
            userIdentifier: session.user.identifier,
            sessionId: identifier.createIdentifier(headers.mobileUid),
            sharingId,
            status: UserHistoryItemStatus.Done,
            statusHistory: [{ status: UserHistoryItemStatus.Done, date: updatedDate }],
            documents: [],
            date: expect.any(Date),
            acquirer,
        })
    })

    it(`should still return done ${HistoryAction.Signing} items if the processing threshold has passed`, async () => {
        const session: UserSession = sessionGenerator.getUserSession()
        const headers = sessionGenerator.getHeaders()

        const { resourceId, acquirer, offer } = await acquirersSigningStatusEventMock.handle(session, headers, UserHistoryItemStatus.Done)

        const query: FilterQuery<UserSigningHistoryItemModel> = { resourceId }
        const updatedDate: Date = new Date(Date.now() - userHistoryDataMapper.failHistoryItemThreshold)
        const modifier: UpdateQuery<UserSigningHistoryItemModel> = {
            statusHistory: [{ status: UserHistoryItemStatus.Done, date: updatedDate }],
        }

        await userSigningHistoryItemModel.updateOne(query, modifier)

        const { total, history } = await getHistoryByActionAction.handler({ params: { action: HistoryAction.Signing }, session, headers })
        const [item]: HistoryItem[] = history

        expect(total).toBe(1)
        expect(item).toEqual<HistoryItem>({
            id: resourceId,
            status: UserHistoryItemStatus.Done,
            recipient: { name: acquirer.name, address: acquirer.address },
            date: expect.any(String),
            documents: expect.any(Array),
            purpose: offer.name,
        })

        const record = await userSigningHistoryItemModel.findOneAndDelete(query).lean()

        expect(record).toMatchObject<UserSigningHistoryItem>({
            userIdentifier: session.user.identifier,
            sessionId: identifier.createIdentifier(headers.mobileUid),
            resourceId,
            status: UserHistoryItemStatus.Done,
            statusHistory: [{ status: UserHistoryItemStatus.Done, date: updatedDate }],
            documents: [],
            date: expect.any(Date),
            acquirer,
            offer,
        })
    })
})
