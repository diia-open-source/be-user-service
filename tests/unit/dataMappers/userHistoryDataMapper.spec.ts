import {
    DurationMs,
    MessageBodyItem,
    MessageBodyItemType,
    PlatformType,
    PublicServiceContextMenuType,
    StatusType,
} from '@diia-inhouse/types'

import userSharingHistoryItemModel from '@models/userSharingHistoryItem'
import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'

import { GetHistoryItemBodyPayload, UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Data Mapper ${UserHistoryDataMapper.name}`, () => {
    const dataMapper = new UserHistoryDataMapper()

    describe(`method ${dataMapper.getStatus.name}`, () => {
        it.each([
            [
                UserHistoryItemStatus.Done,
                userSharingHistoryItemModel.name,
                UserHistoryItemStatus.Done,
                new userSharingHistoryItemModel({
                    status: UserHistoryItemStatus.Done,
                    statusHistory: [{ date: new Date(), status: UserHistoryItemStatus.Done }],
                }),
            ],
            [
                UserHistoryItemStatus.Processing,
                userSharingHistoryItemModel.name,
                UserHistoryItemStatus.Processing,
                new userSharingHistoryItemModel({
                    status: UserHistoryItemStatus.Processing,
                    statusHistory: [{ date: new Date(), status: UserHistoryItemStatus.Done }],
                }),
            ],
            [
                UserHistoryItemStatus.Refuse,
                userSharingHistoryItemModel.name,
                UserHistoryItemStatus.Processing,
                new userSharingHistoryItemModel({
                    status: UserHistoryItemStatus.Processing,
                    statusHistory: [{ date: new Date(Date.now() - DurationMs.Day), status: UserHistoryItemStatus.Done }],
                }),
            ],
            [
                UserHistoryItemStatus.Done,
                userSigningHistoryItemModel.name,
                UserHistoryItemStatus.Done,
                new userSigningHistoryItemModel({
                    status: UserHistoryItemStatus.Done,
                    statusHistory: [{ date: new Date(), status: UserHistoryItemStatus.Done }],
                }),
            ],
            [
                UserHistoryItemStatus.Processing,
                userSigningHistoryItemModel.name,
                UserHistoryItemStatus.Processing,
                new userSigningHistoryItemModel({
                    status: UserHistoryItemStatus.Processing,
                    statusHistory: [{ date: new Date(), status: UserHistoryItemStatus.Done }],
                }),
            ],
            [
                UserHistoryItemStatus.Refuse,
                userSigningHistoryItemModel.name,
                UserHistoryItemStatus.Processing,
                new userSigningHistoryItemModel({
                    status: UserHistoryItemStatus.Processing,
                    statusHistory: [{ date: new Date(Date.now() - DurationMs.Day), status: UserHistoryItemStatus.Done }],
                }),
            ],
        ])('should return status %s of model %s with status %s', (expectedStatus, _modelName, _modelStatus, model) => {
            const result = dataMapper.getStatus(model)

            expect(result).toBe(expectedStatus)
        })
    })

    describe(`method ${dataMapper.getHistoryScreenNavigationPanel.name}`, () => {
        it('should return history screen nav panel', () => {
            const result = dataMapper.getHistoryScreenNavigationPanel()

            expect(result).toEqual({
                header: 'Дія.Підпис',
                contextMenu: [
                    {
                        type: PublicServiceContextMenuType.faqCategory,
                        code: 'diiaId',
                        name: 'Питання та відповіді',
                    },
                    {
                        type: PublicServiceContextMenuType.supportServiceScreen,
                        name: 'Служба підтримки',
                    },
                ],
            })
        })
    })

    describe(`method ${dataMapper.getHistoryScreenNavigationPanel.name}`, () => {
        it('should return history screen navigation panel mlc', () => {
            const result = dataMapper.getHistoryScreenNavigationPanelMlc('label')

            expect(result).toEqual({
                label: 'label',
                ellipseMenu: [
                    {
                        type: PublicServiceContextMenuType.faqCategory,
                        name: 'Питання та відповіді',
                        code: 'diiaId',
                    },
                    {
                        type: PublicServiceContextMenuType.supportServiceScreen,
                        name: 'Служба підтримки',
                    },
                ],
            })
        })

        it('should return history screen navigation panel mlc without label', () => {
            const result = dataMapper.getHistoryScreenNavigationPanelMlc()

            expect(result).toEqual({
                label: 'Історія підписань',
                ellipseMenu: [
                    {
                        type: PublicServiceContextMenuType.faqCategory,
                        name: 'Питання та відповіді',
                        code: 'diiaId',
                    },
                    {
                        type: PublicServiceContextMenuType.supportServiceScreen,
                        name: 'Служба підтримки',
                    },
                ],
            })
        })
    })

    describe(`method ${dataMapper.getStubMessageByActionV1.name}`, () => {
        it.each([
            [UserHistoryCode.Authorization, { icon: '🤷‍♂️', text: 'Ви ще не здійснювали \nавторизацію через Дія.Підпис.' }],
            [UserHistoryCode.Signing, { icon: '🤷‍♂️', text: 'Ви ще не підписали жодного \nдокумента в Дії.' }],
        ])('should return stub message for %s action', (action, expected) => {
            const result = dataMapper.getStubMessageByActionV1(action)

            expect(result).toEqual(expected)
        })
    })

    describe(`method ${dataMapper.getStubMessageByAction.name}`, () => {
        it.each([
            [UserHistoryCode.Authorization, { icon: '🤷‍♂️', parameters: [], title: 'Ви ще не здійснювали \nавторизацію через Дія.Підпис.' }],
            [UserHistoryCode.Signing, { icon: '🤷‍♂️', parameters: [], title: 'Ви ще не підписали жодного \nдокумента в Дії.' }],
            [
                UserHistoryCode.Sharing,
                { icon: '📄', parameters: [], title: 'Тут ви зможете переглянути історію запитів на копії ваших цифрових документів.' },
            ],
        ])('should return stub message for %s action', (action, expected) => {
            const result = dataMapper.getStubMessageByAction(action)

            expect(result).toEqual(expected)
        })
    })

    describe(`method ${dataMapper.getHistoryItemTitleByAction.name}`, () => {
        it.each([
            [UserHistoryCode.Authorization, 'Запит на авторизацію з Дія.Підпис'],
            [UserHistoryCode.Signing, 'Запит на підписання цифрових документів'],
        ])('should return title for %s action', (action, expected) => {
            const result = dataMapper.getHistoryItemTitleByAction(action)

            expect(result).toEqual(expected)
        })
    })

    describe(`method ${dataMapper.getHistoryItemStatusMessageIconByStatus.name}`, () => {
        it.each([
            [UserHistoryItemStatus.Done, '✅'],
            [UserHistoryItemStatus.Refuse, '🚫'],
            [UserHistoryItemStatus.Processing, '⏳'],
        ])('should return icon for %s status', (status, expected) => {
            const result = dataMapper.getHistoryItemStatusMessageIconByStatus(status)

            expect(result).toEqual(expected)
        })
    })

    describe(`method ${dataMapper.getHistoryItemStatusNameByActionAndStatus.name}`, () => {
        it.each([
            [UserHistoryCode.Authorization, UserHistoryItemStatus.Done, 'Авторизовано'],
            [UserHistoryCode.Authorization, UserHistoryItemStatus.Refuse, 'Не авторизовано'],
            [UserHistoryCode.Authorization, UserHistoryItemStatus.Processing, 'Авторизуємо'],
            [UserHistoryCode.Signing, UserHistoryItemStatus.Done, 'Підписано'],
            [UserHistoryCode.Signing, UserHistoryItemStatus.Refuse, 'Не підписано'],
            [UserHistoryCode.Signing, UserHistoryItemStatus.Processing, 'Підписуємо'],
        ])('should return status name for %s action and %s status', (action, status, expected) => {
            const result = dataMapper.getHistoryItemStatusNameByActionAndStatus(action, status)

            expect(result).toBe(expected)
        })
    })

    describe(`method ${dataMapper.getHistoryStatusChipTypeByStatus.name}`, () => {
        it.each([
            [UserHistoryItemStatus.Done, StatusType.success],
            [UserHistoryItemStatus.Refuse, StatusType.neutral],
            [UserHistoryItemStatus.Processing, StatusType.pending],
        ])('should return status type for %s status', (status, expected) => {
            const result = dataMapper.getHistoryStatusChipTypeByStatus(status)

            expect(result).toBe(expected)
        })
    })

    describe(`method ${dataMapper.getHistoryItemBodyByAction.name}`, () => {
        it.each([
            [
                UserHistoryCode.Authorization,
                ({ platformType, platformVersion }: GetHistoryItemBodyPayload): MessageBodyItem[] => [
                    {
                        type: MessageBodyItemType.text,
                        data: {
                            text: `Пристрій, з якого здійснено авторизацію: \n${platformType} ${platformVersion}`,
                            parameters: [],
                        },
                    },
                ],
            ],
            [
                UserHistoryCode.Signing,
                ({ platformType, platformVersion, documents }: GetHistoryItemBodyPayload): MessageBodyItem[] => [
                    {
                        type: MessageBodyItemType.text,
                        data: {
                            text: `Було підписано наступні документи:\n• ${documents.join(
                                '\n• ',
                            )}\n\nПристрій, з якого підписано: \n${platformType} ${platformVersion}`,
                            parameters: [],
                        },
                    },
                ],
            ],
            [UserHistoryCode.Sharing, (): MessageBodyItem[] => []],
        ])('should return history item body by %s action', (action, getExpected) => {
            const payload: GetHistoryItemBodyPayload = {
                platformType: PlatformType.iOS,
                platformVersion: '11.0.1',
                documents: ['doc1', 'doc2'],
            }
            const expected = getExpected(payload)

            const result = dataMapper.getHistoryItemBodyByAction(action, payload)

            expect(result).toEqual(expected)
        })

        it('should throw error if invalid action was passed', () => {
            const payload: GetHistoryItemBodyPayload = {
                platformType: PlatformType.iOS,
                platformVersion: '11.0.1',
                documents: ['doc1', 'doc2'],
            }
            const action = 'invalid-action'

            expect(() => dataMapper.getHistoryItemBodyByAction(<UserHistoryCode>action, payload)).toThrow(
                new TypeError(`Unhandled history signing code action type: ${action}`),
            )
        })
    })
})
