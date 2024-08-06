import { randomUUID } from 'node:crypto'

import { mongo } from '@diia-inhouse/db'
import TestKit from '@diia-inhouse/test'

import GetSessionHistoryItemByIdAction from '@src/actions/v1/userHistory/getSessionHistoryItemById'

import AuthService from '@services/auth'
import DocumentsService from '@services/documents'

import userSharingHistoryItemModel from '@models/userSharingHistoryItem'
import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'
import UserSigningHistoryDataMapper from '@dataMappers/userSigningHistoryDataMapper'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/userHistory/getSessionHistoryItemById'
import { UserSharingHistoryItem } from '@interfaces/models/userSharingHistoryItem'
import { UserSigningHistoryItem } from '@interfaces/models/userSigningHistoryItem'
import { GetHistoryItemBodyPayload, UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetSessionHistoryItemByIdAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>

    let getSharingHistoryItemByIdAction: GetSessionHistoryItemByIdAction
    let authService: AuthService
    let documentsService: DocumentsService
    let userHistoryDataMapper: UserHistoryDataMapper
    let userSigningHistoryDataMapper: UserSigningHistoryDataMapper

    const testKit = new TestKit()

    beforeAll(async () => {
        app = await getApp()

        getSharingHistoryItemByIdAction = app.container.build(GetSessionHistoryItemByIdAction)
        authService = app.container.resolve<AuthService>('authService')
        documentsService = app.container.resolve<DocumentsService>('documentsService')
        userHistoryDataMapper = app.container.resolve<UserHistoryDataMapper>('userHistoryDataMapper')
        userSigningHistoryDataMapper = app.container.resolve<UserSigningHistoryDataMapper>('userSigningHistoryDataMapper')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it(`should return ${UserHistoryCode.Sharing} history item by provided id and sessionId`, async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        jest.spyOn(authService, 'getSessionById').mockResolvedValueOnce({
            status: true,
            platformType: 'IOS',
            platformVersion: '14.4.2',
            appVersion: '3.0.0',
        })
        jest.spyOn(documentsService, 'getDocumentNames').mockResolvedValueOnce(['driver-license-name'])

        const {
            user: { identifier: userIdentifier },
        } = session

        const status = UserHistoryItemStatus.Done
        const action = UserHistoryCode.Sharing

        const sessionId = randomUUID()
        const sharingId = randomUUID()

        const sharingHistoryItems: UserSharingHistoryItem[] = [
            {
                userIdentifier,
                sessionId,
                sharingId,
                status,
                statusHistory: [{ status, date: new Date() }],
                documents: ['driver-license'],
                date: new Date(),
                acquirer: {
                    id: new mongo.ObjectId(),
                    name: 'name',
                    address: 'address',
                },
            },
        ]

        await userSharingHistoryItemModel.insertMany(sharingHistoryItems)
        const navigationPanelMlc = userHistoryDataMapper.getHistoryScreenNavigationPanelMlc('IOS 14.4.2')

        // Act
        const result = await getSharingHistoryItemByIdAction.handler({
            session,
            headers,
            params: {
                itemId: sharingId,
                actionCode: action,
                sessionId,
            },
        })

        // Assert
        expect(result).toEqual<ActionResult>({
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc,
                    },
                },
            ],
            body: [
                {
                    titleLabelMlc: {
                        label: userHistoryDataMapper.getHistoryItemTitleByAction(action),
                    },
                },
                {
                    statusMessageMlc: {
                        icon: userHistoryDataMapper.getHistoryItemStatusMessageIconByStatus(status),
                        title: expect.any(String),
                        text: expect.any(String),
                        parameters: [],
                    },
                },
                {
                    subtitleLabelMlc: {
                        label: expect.any(String),
                    },
                },
                {
                    textLabelMlc: {
                        text: expect.any(String),
                        parameters: [],
                    },
                },
            ],
        })
    })

    it(`should return ${UserHistoryCode.Signing} history item by provided id and sessionId`, async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        jest.spyOn(authService, 'getSessionById').mockResolvedValueOnce({
            status: true,
            platformType: 'IOS',
            platformVersion: '14.4.2',
            appVersion: '3.0.0',
        })

        const {
            user: { identifier: userIdentifier },
        } = session

        const { platformType, platformVersion } = headers

        const status = UserHistoryItemStatus.Done
        const action = UserHistoryCode.Signing
        const sessionId = randomUUID()

        const signingHistoryItems: UserSigningHistoryItem[] = [
            {
                userIdentifier,
                sessionId,
                resourceId: randomUUID(),
                platformType,
                platformVersion,
                action: 'hashedFilesSigningDiiaId',
                status,
                statusHistory: [
                    {
                        status,
                        date: new Date(),
                    },
                ],
                documents: ['someDocument'],
                recipient: {
                    name: 'recipientName',
                    address: 'recipientAddress',
                },
                date: new Date(),
            },
        ]

        const navigationPanelMlc = userHistoryDataMapper.getHistoryScreenNavigationPanelMlc('IOS 14.4.2')

        const address = signingHistoryItems[0]!.recipient!.address

        const payload: GetHistoryItemBodyPayload = {
            platformType: signingHistoryItems[0].platformType,
            platformVersion: signingHistoryItems[0].platformVersion,
            documents: signingHistoryItems[0].documents,
        }

        const textLabelMlc = userSigningHistoryDataMapper.getHistoryItemTextLabelMlcByAction(action, address, payload)

        await userSigningHistoryItemModel.insertMany(signingHistoryItems)

        // Act
        const result = await getSharingHistoryItemByIdAction.handler({
            session,
            headers,
            params: {
                actionCode: action,
                itemId: signingHistoryItems[0].resourceId,
                sessionId,
            },
        })

        // Assert
        expect(result).toEqual<ActionResult>({
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc,
                    },
                },
            ],
            body: [
                {
                    titleLabelMlc: {
                        label: userHistoryDataMapper.getHistoryItemTitleByAction(action),
                    },
                },
                {
                    statusMessageMlc: {
                        icon: userHistoryDataMapper.getHistoryItemStatusMessageIconByStatus(status),
                        title: expect.any(String),
                        text: expect.any(String),
                        parameters: [],
                    },
                },
                {
                    subtitleLabelMlc: {
                        label: expect.any(String),
                    },
                },
                { textLabelMlc },
            ],
        })
    })

    it(`should return ${UserHistoryCode.Authorization} history item by provided id and sessionId`, async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        jest.spyOn(authService, 'getSessionById').mockResolvedValueOnce({
            status: true,
            platformType: 'IOS',
            platformVersion: '14.4.2',
            appVersion: '3.0.0',
        })

        const {
            user: { identifier: userIdentifier },
        } = session

        const { platformType, platformVersion } = headers

        const status = UserHistoryItemStatus.Done
        const action = UserHistoryCode.Authorization
        const sessionId = randomUUID()

        const signingHistoryItems: UserSigningHistoryItem[] = [
            {
                userIdentifier,
                sessionId,
                resourceId: randomUUID(),
                platformType,
                platformVersion,
                action: 'authDiiaId',
                status,
                statusHistory: [
                    {
                        status,
                        date: new Date(),
                    },
                ],
                documents: ['someDocument'],
                recipient: {
                    name: 'recipientName',
                    address: 'recipientAddress',
                },
                date: new Date(),
            },
        ]

        const navigationPanelMlc = userHistoryDataMapper.getHistoryScreenNavigationPanelMlc('IOS 14.4.2')

        const address = signingHistoryItems[0]!.recipient!.address

        const payload: GetHistoryItemBodyPayload = {
            platformType: signingHistoryItems[0].platformType,
            platformVersion: signingHistoryItems[0].platformVersion,
            documents: signingHistoryItems[0].documents,
        }

        const textLabelMlc = userSigningHistoryDataMapper.getHistoryItemTextLabelMlcByAction(action, address, payload)

        await userSigningHistoryItemModel.insertMany(signingHistoryItems)

        // Act
        const result = await getSharingHistoryItemByIdAction.handler({
            session,
            headers,
            params: {
                actionCode: action,
                itemId: signingHistoryItems[0].resourceId,
                sessionId,
            },
        })

        // Assert
        expect(result).toEqual<ActionResult>({
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc,
                    },
                },
            ],
            body: [
                {
                    titleLabelMlc: {
                        label: userHistoryDataMapper.getHistoryItemTitleByAction(action),
                    },
                },
                {
                    statusMessageMlc: {
                        icon: userHistoryDataMapper.getHistoryItemStatusMessageIconByStatus(status),
                        title: expect.any(String),
                        text: expect.any(String),
                        parameters: [],
                    },
                },
                {
                    subtitleLabelMlc: {
                        label: expect.any(String),
                    },
                },
                { textLabelMlc },
            ],
        })
    })
})
