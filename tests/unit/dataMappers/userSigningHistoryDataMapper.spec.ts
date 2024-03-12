const momentFormatStub = jest.fn()

const utilsMock = {
    formatDate: jest.fn(),
}

jest.mock('moment', () => (): unknown => ({ format: momentFormatStub }))

jest.mock('@diia-inhouse/utils', () => ({
    utils: utilsMock,
}))

import { randomUUID } from 'crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ButtonState, ChipStatusAtmType, DocumentType } from '@diia-inhouse/types'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'
import UserSigningHistoryDataMapper from '@dataMappers/userSigningHistoryDataMapper'

import { UserSigningHistoryItemModel } from '@interfaces/models/userSigningHistoryItem'
import { GetHistoryItemBodyPayload, UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe('UserSigningHistoryDataMapper', () => {
    const testKit = new TestKit()
    const userHistoryDataMapperMock = mockInstance(UserHistoryDataMapper)
    const userSigningHistoryDataMapper = new UserSigningHistoryDataMapper(userHistoryDataMapperMock)
    const date = new Date()
    const resourceId = randomUUID()
    const acquirer = { name: 'acquirer-name', address: 'acquirer-address' }
    const recipient = { name: 'recipient-name', address: 'recipient-address' }
    const documents = [DocumentType.BirthCertificate]
    const offer = { name: 'offer-name' }
    const headers = testKit.session.getHeaders()

    describe('method: `toEntity`', () => {
        it.each([
            [
                'acquirer is present',
                <UserSigningHistoryItemModel>{
                    resourceId,
                    acquirer,
                    recipient,
                    date,
                    documents,
                    offer,
                },
                {
                    id: resourceId,
                    status: UserHistoryItemStatus.Done,
                    date: date.toISOString(),
                    documents,
                    recipient: acquirer,
                    purpose: offer?.name,
                },
            ],
            [
                'acquirer is missing',
                <UserSigningHistoryItemModel>{
                    resourceId,
                    recipient,
                    date,
                    documents,
                    offer,
                },
                {
                    id: resourceId,
                    status: UserHistoryItemStatus.Done,
                    date: date.toISOString(),
                    documents,
                    recipient,
                    purpose: offer?.name,
                },
            ],
        ])('should return valid history item in case %s', (_msg, model, expectedResult) => {
            momentFormatStub.mockReturnValueOnce(date.toISOString())
            jest.spyOn(userHistoryDataMapperMock, 'getStatus').mockReturnValueOnce(UserHistoryItemStatus.Done)

            expect(userSigningHistoryDataMapper.toEntity(model)).toEqual(expectedResult)

            expect(userHistoryDataMapperMock.getStatus).toHaveBeenCalledWith(model)
        })
    })

    describe('method: `toHistoryItemEntityV1`', () => {
        it.each([
            [
                'acquirer is present',
                <UserSigningHistoryItemModel>{
                    resourceId,
                    acquirer,
                    recipient,
                    date,
                    documents,
                    offer,
                },
                {
                    id: resourceId,
                    status: UserHistoryItemStatus.Done,
                    statusName: 'Signed',
                    date: date.toISOString(),
                    recipient: acquirer,
                },
            ],
            [
                'acquirer is missing',
                <UserSigningHistoryItemModel>{
                    resourceId,
                    recipient,
                    date,
                    documents,
                    offer,
                },
                {
                    id: resourceId,
                    status: UserHistoryItemStatus.Done,
                    statusName: 'Signed',
                    date: date.toISOString(),
                    recipient: recipient,
                },
            ],
        ])('should return valid history item by code in case %s', (_msg, model, expectedResult) => {
            momentFormatStub.mockReturnValueOnce(date.toISOString())
            jest.spyOn(userHistoryDataMapperMock, 'getStatus').mockReturnValueOnce(UserHistoryItemStatus.Done)
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemStatusNameByActionAndStatus').mockReturnValueOnce('Signed')

            expect(userSigningHistoryDataMapper.toHistoryItemEntityV1(model, UserHistoryCode.Signing)).toEqual(expectedResult)

            expect(userHistoryDataMapperMock.getStatus).toHaveBeenCalledWith(model)
            expect(userHistoryDataMapperMock.getHistoryItemStatusNameByActionAndStatus).toHaveBeenCalledWith(
                UserHistoryCode.Signing,
                UserHistoryItemStatus.Done,
            )
        })
    })

    describe('method: `toHistoryItemEntity`', () => {
        it.each([
            [
                'acquirer is present',
                <UserSigningHistoryItemModel>{
                    resourceId,
                    acquirer,
                    recipient,
                    date,
                },
                {
                    id: resourceId,
                    chipStatusAtm: {
                        code: UserHistoryItemStatus.Done,
                        name: 'Signed',
                        type: ChipStatusAtmType.success,
                    },
                    title: acquirer.name,
                    description: acquirer.address,
                    botLabel: 'date',
                    btnPrimaryAdditionalAtm: {
                        label: 'Детальніше',
                        state: ButtonState.enabled,
                        action: {
                            type: 'historyItemsStatus',
                        },
                    },
                },
            ],
            [
                'acquirer is missing',
                <UserSigningHistoryItemModel>{
                    resourceId,
                    recipient,
                    date,
                    documents,
                    offer,
                },
                {
                    id: resourceId,
                    chipStatusAtm: {
                        code: UserHistoryItemStatus.Done,
                        name: 'Signed',
                        type: ChipStatusAtmType.success,
                    },
                    title: recipient.name,
                    description: recipient.address,
                    botLabel: 'date',
                    btnPrimaryAdditionalAtm: {
                        label: 'Детальніше',
                        state: ButtonState.enabled,
                        action: {
                            type: 'historyItemsStatus',
                        },
                    },
                },
            ],
        ])('should return valid card mlc in case %s', (_msg, model, expectedResult) => {
            utilsMock.formatDate.mockReturnValueOnce('date')
            momentFormatStub.mockReturnValueOnce(date.toISOString())
            jest.spyOn(userHistoryDataMapperMock, 'getStatus').mockReturnValueOnce(UserHistoryItemStatus.Done)
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemStatusNameByActionAndStatus').mockReturnValueOnce('Signed')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryStatusChipTypeByStatus').mockReturnValueOnce(ChipStatusAtmType.success)

            expect(userSigningHistoryDataMapper.toHistoryItemEntity(model, UserHistoryCode.Signing)).toEqual(expectedResult)

            expect(userHistoryDataMapperMock.getStatus).toHaveBeenCalledWith(model)
            expect(userHistoryDataMapperMock.getHistoryItemStatusNameByActionAndStatus).toHaveBeenCalledWith(
                UserHistoryCode.Signing,
                UserHistoryItemStatus.Done,
            )
        })
    })

    describe('method: `getHistoryItemV1`', () => {
        it.each([
            [
                'acquirer is present',
                <UserSigningHistoryItemModel>{
                    resourceId,
                    acquirer,
                    recipient,
                    date,
                    documents,
                    offer,
                },
                {
                    title: 'Signing title',
                    status: UserHistoryItemStatus.Done,
                    statusMessage: {
                        title: 'Signed',
                        text: date.toISOString(),
                        icon: 'done-icon.png',
                        parameters: [],
                    },
                    recipient: acquirer,
                    body: [],
                },
            ],
            [
                'acquirer is missing',
                <UserSigningHistoryItemModel>{
                    resourceId,
                    recipient,
                    date,
                    documents,
                    offer,
                },
                {
                    title: 'Signing title',
                    status: UserHistoryItemStatus.Done,
                    statusMessage: {
                        title: 'Signed',
                        text: date.toISOString(),
                        icon: 'done-icon.png',
                        parameters: [],
                    },
                    recipient,
                    body: [],
                },
            ],
        ])('should return valid history item by code in case %s', (_msg, model, expectedResult) => {
            momentFormatStub.mockReturnValueOnce(date.toISOString())
            jest.spyOn(userHistoryDataMapperMock, 'getStatus').mockReturnValueOnce(UserHistoryItemStatus.Done)
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemStatusNameByActionAndStatus').mockReturnValueOnce('Signed')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemTitleByAction').mockReturnValueOnce('Signing title')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemStatusMessageIconByStatus').mockReturnValueOnce('done-icon.png')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemBodyByAction').mockReturnValueOnce([])

            expect(userSigningHistoryDataMapper.getHistoryItemV1(model, UserHistoryCode.Signing, <GetHistoryItemBodyPayload>{})).toEqual(
                expectedResult,
            )

            expect(userHistoryDataMapperMock.getStatus).toHaveBeenCalledWith(model)
            expect(userHistoryDataMapperMock.getHistoryItemStatusNameByActionAndStatus).toHaveBeenCalledWith(
                UserHistoryCode.Signing,
                UserHistoryItemStatus.Done,
            )
            expect(userHistoryDataMapperMock.getHistoryItemTitleByAction).toHaveBeenCalledWith(UserHistoryCode.Signing)
            expect(userHistoryDataMapperMock.getHistoryItemStatusMessageIconByStatus).toHaveBeenCalledWith(UserHistoryItemStatus.Done)
            expect(userHistoryDataMapperMock.getHistoryItemBodyByAction).toHaveBeenCalledWith(UserHistoryCode.Signing, {})
        })
    })

    describe('method: `getHistoryItemTextLabelMlcByAction`', () => {
        const address = 'м. Київ'
        const platformType = headers.platformType
        const platformVersion = headers.platformVersion

        it.each([
            [
                UserHistoryCode.Authorization,
                address,
                { platformType, platformVersion, documents: [] },
                { parameters: [], text: `${address}. \n\nПристрій, з якого здійснено авторизацію: \n${platformType} ${platformVersion}` },
            ],
            [
                UserHistoryCode.Signing,
                address,
                { platformType, platformVersion, documents: ['doc1', 'doc2'] },
                {
                    parameters: [],
                    text:
                        `${address}. \n\nБуло підписано наступні документи:\n• ${['doc1', 'doc2'].join('\n• ')}` +
                        `\n\nПристрій, з якого підписано: \n${platformType} ${platformVersion}`,
                },
            ],
            [UserHistoryCode.Sharing, address, { platformType, platformVersion, documents: [] }, undefined],
        ])('should return text label for %s action', (action, _address, payload, expected) => {
            const result = userSigningHistoryDataMapper.getHistoryItemTextLabelMlcByAction(action, _address, payload)

            expect(result).toEqual(expected)
        })

        it('should throw error if invalid action passed', () => {
            const payload = {
                platformType,
                platformVersion,
                documents: ['doc1', 'doc2'],
            }
            const action = <UserHistoryCode>'invalid-action'

            expect(() => userSigningHistoryDataMapper.getHistoryItemTextLabelMlcByAction(action, address, payload)).toThrow(
                new TypeError(`Unhandled history signing code action type: ${action}`),
            )
        })
    })

    describe('method: `getHistoryItem`', () => {
        it('should return history action recipient if acquirer exists', async () => {
            const payload = {
                platformType: headers.platformType,
                platformVersion: headers.platformVersion,
                documents: [],
            }

            const model = <UserSigningHistoryItemModel>{
                resourceId,
                acquirer,
                date,
                documents,
                offer,
            }

            utilsMock.formatDate.mockReturnValueOnce('date')
            momentFormatStub.mockReturnValueOnce(date.toISOString())
            jest.spyOn(userHistoryDataMapperMock, 'getStatus').mockReturnValueOnce(UserHistoryItemStatus.Done)
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemTitleByAction').mockReturnValueOnce('Запит на авторизацію з Дія.Підпис')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemStatusMessageIconByStatus').mockReturnValueOnce('✅')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemStatusNameByActionAndStatus').mockReturnValueOnce('Signed')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryStatusChipTypeByStatus').mockReturnValueOnce(ChipStatusAtmType.success)
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryStatusChipTypeByStatus').mockReturnValueOnce(ChipStatusAtmType.success)

            const textLabel = {
                text: `Address. \n\nПристрій, з якого здійснено авторизацію: \n${headers.platformType} ${headers.platformVersion}`,
                parameters: [],
            }

            jest.spyOn(userSigningHistoryDataMapper, 'getHistoryItemTextLabelMlcByAction').mockReturnValueOnce(textLabel)

            const result = [
                {
                    titleLabelMlc: {
                        label: 'Запит на авторизацію з Дія.Підпис',
                    },
                },
                {
                    statusMessageMlc: {
                        icon: '✅',
                        title: 'Signed',
                        text: 'date',
                        parameters: [],
                    },
                },
                {
                    subtitleLabelMlc: {
                        label: acquirer.name,
                    },
                },
                { textLabelMlc: textLabel },
            ]

            expect(userSigningHistoryDataMapper.getHistoryItem(model, UserHistoryCode.Authorization, payload)).toEqual(result)

            expect(userHistoryDataMapperMock.getStatus).toHaveBeenCalledWith(model)
            expect(userHistoryDataMapperMock.getHistoryItemStatusNameByActionAndStatus).toHaveBeenCalledWith(
                UserHistoryCode.Authorization,
                UserHistoryItemStatus.Done,
            )
        })

        it('should return history action recipient if acquirer does not exist', async () => {
            const payload = {
                platformType: headers.platformType,
                platformVersion: headers.platformVersion,
                documents: [],
            }

            const model = <UserSigningHistoryItemModel>{
                resourceId,
                recipient,
                date,
                documents,
                offer,
            }

            utilsMock.formatDate.mockReturnValueOnce('date')
            momentFormatStub.mockReturnValueOnce(date.toISOString())
            jest.spyOn(userHistoryDataMapperMock, 'getStatus').mockReturnValueOnce(UserHistoryItemStatus.Done)
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemTitleByAction').mockReturnValueOnce('Запит на авторизацію з Дія.Підпис')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemStatusMessageIconByStatus').mockReturnValueOnce('✅')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryItemStatusNameByActionAndStatus').mockReturnValueOnce('Signed')
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryStatusChipTypeByStatus').mockReturnValueOnce(ChipStatusAtmType.success)
            jest.spyOn(userHistoryDataMapperMock, 'getHistoryStatusChipTypeByStatus').mockReturnValueOnce(ChipStatusAtmType.success)

            const textLabel = {
                text: `Address. \n\nПристрій, з якого здійснено авторизацію: \n${headers.platformType} ${headers.platformVersion}`,
                parameters: [],
            }

            jest.spyOn(userSigningHistoryDataMapper, 'getHistoryItemTextLabelMlcByAction').mockReturnValueOnce(textLabel)

            const result = [
                {
                    titleLabelMlc: {
                        label: 'Запит на авторизацію з Дія.Підпис',
                    },
                },
                {
                    statusMessageMlc: {
                        icon: '✅',
                        title: 'Signed',
                        text: 'date',
                        parameters: [],
                    },
                },
                {
                    subtitleLabelMlc: {
                        label: recipient.name,
                    },
                },
                { textLabelMlc: textLabel },
            ]

            expect(userSigningHistoryDataMapper.getHistoryItem(model, UserHistoryCode.Authorization, payload)).toEqual(result)

            expect(userHistoryDataMapperMock.getStatus).toHaveBeenCalledWith(model)
            expect(userHistoryDataMapperMock.getHistoryItemStatusNameByActionAndStatus).toHaveBeenCalledWith(
                UserHistoryCode.Authorization,
                UserHistoryItemStatus.Done,
            )
        })
    })
})
