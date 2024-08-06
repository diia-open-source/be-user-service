import { randomUUID } from 'node:crypto'

import { SessionByIdResponse } from '@diia-inhouse/auth-service-client'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ContentType, PublicServiceContextMenuType } from '@diia-inhouse/types'

import AuthService from '@services/auth'
import UserHistoryService from '@services/userHistory'
import UserSharingHistoryService from '@services/userSharingHistory'
import UserSigningHistoryService from '@services/userSigningHistory'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'

import {
    HistoryAction,
    HistoryItemResponse,
    HistoryScreenResponse,
    UserHistoryCode,
    UserHistoryItemStatus,
} from '@interfaces/services/userHistory'

describe(`Service ${UserHistoryService.name}`, () => {
    const testKit = new TestKit()

    const userSharingHistoryService = mockInstance(UserSharingHistoryService)
    const userSigningHistoryService = mockInstance(UserSigningHistoryService)
    const userHistoryDataMapper = new UserHistoryDataMapper()
    const authService = mockInstance(AuthService)

    const userHistoryService = new UserHistoryService(
        userSharingHistoryService,
        userSigningHistoryService,
        userHistoryDataMapper,
        authService,
    )

    const user = testKit.session.getUserSession().user
    const sessionId = randomUUID()
    const headers = testKit.session.getHeaders()

    describe(`method ${userHistoryService.getHistoryByAction.name}`, () => {
        it('should return user history with sharing action', async () => {
            const historyResponse = {
                history: [
                    {
                        id: '1',
                        status: UserHistoryItemStatus.Processing,
                        recipient: { name: 'name', address: 'address' },
                        date: 'date',
                        documents: ['doc1', 'doc2'],
                    },
                ],
                total: 1,
            }

            jest.spyOn(userSharingHistoryService, 'getHistory').mockResolvedValueOnce(historyResponse)

            expect(await userHistoryService.getHistoryByAction(HistoryAction.Sharing, user.identifier, sessionId, 1, 10)).toMatchObject(
                historyResponse,
            )
            expect(userSharingHistoryService.getHistory).toHaveBeenCalledWith(user.identifier, sessionId, 1, 10)
        })

        it('should return user history with signing action', async () => {
            const historyResponse = {
                history: [
                    {
                        id: '1',
                        status: UserHistoryItemStatus.Processing,
                        recipient: { name: 'name', address: 'address' },
                        date: 'date',
                        documents: ['doc1', 'doc2'],
                    },
                ],
                total: 1,
            }

            jest.spyOn(userSigningHistoryService, 'getHistory').mockResolvedValueOnce(historyResponse)

            expect(await userHistoryService.getHistoryByAction(HistoryAction.Signing, user.identifier, sessionId, 1, 10)).toMatchObject(
                historyResponse,
            )
            expect(userSigningHistoryService.getHistory).toHaveBeenCalledWith(user.identifier, sessionId, 1, 10)
        })

        it('should throw TypeError if given action not found', async () => {
            const action = <HistoryAction>'wrong-action'

            await expect(userHistoryService.getHistoryByAction(action, user.identifier, sessionId, 1, 10)).rejects.toThrow(
                new TypeError(`Unhandled action: ${action}`),
            )
        })
    })

    describe(`method ${userHistoryService.getHistoryItemsV1.name}`, () => {
        it('should return empty array with message if signing history not found', async () => {
            const historyResponse = {
                items: [],
                total: 0,
            }

            const stubMessage = {
                icon: '🤷‍♂️',
                text: 'Ви ще не підписали жодного \nдокумента в Дії.',
            }

            const response = { stubMessage, items: [], total: 0 }

            jest.spyOn(userSigningHistoryService, 'getSigningHistoryByActionV1').mockResolvedValueOnce(historyResponse)

            expect(await userHistoryService.getHistoryItemsV1(UserHistoryCode.Signing, user.identifier, 1, 10)).toMatchObject(response)
            expect(userSigningHistoryService.getSigningHistoryByActionV1).toHaveBeenCalledWith(
                UserHistoryCode.Signing,
                user.identifier,
                1,
                10,
            )
        })

        it('should return signing history by code', async () => {
            const historyResponse = {
                items: [
                    {
                        id: '1',
                        status: UserHistoryItemStatus.Processing,
                        recipient: { name: 'name', address: 'address' },
                        statusName: 'statusName',
                        date: 'date',
                        documents: ['doc1', 'doc2'],
                    },
                ],
                total: 1,
            }

            jest.spyOn(userSigningHistoryService, 'getSigningHistoryByActionV1').mockResolvedValueOnce(historyResponse)

            expect(await userHistoryService.getHistoryItemsV1(UserHistoryCode.Signing, user.identifier, 1, 10)).toMatchObject(
                historyResponse,
            )

            expect(userSigningHistoryService.getSigningHistoryByActionV1).toHaveBeenCalledWith(
                UserHistoryCode.Signing,
                user.identifier,
                1,
                10,
            )
        })
    })

    describe(`method ${userHistoryService.getHistoryScreen.name}`, () => {
        it('should return history screen', async () => {
            const mockData: Record<UserHistoryCode, number> = {
                [UserHistoryCode.Authorization]: 100,
                [UserHistoryCode.Signing]: 200,
                [UserHistoryCode.Sharing]: 200,
            }
            const historyScreenNavigationPanelMlc = {
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
            }

            jest.spyOn(userSigningHistoryService, 'getHistoryScreenCounts').mockResolvedValueOnce(mockData)
            jest.spyOn(userSharingHistoryService, 'countHistory').mockResolvedValueOnce(mockData[UserHistoryCode.Sharing])
            jest.spyOn(userHistoryDataMapper, 'getHistoryScreenNavigationPanelMlc').mockReturnValueOnce(historyScreenNavigationPanelMlc)

            const expected: HistoryScreenResponse = {
                topGroup: [
                    {
                        topGroupOrg: {
                            navigationPanelMlc: historyScreenNavigationPanelMlc,
                            chipTabsOrg: {
                                items: [
                                    {
                                        chipMlc: {
                                            code: UserHistoryCode.Authorization,
                                            label: 'Авторизації',
                                            badgeCounterAtm: {
                                                count: mockData[UserHistoryCode.Authorization],
                                            },
                                        },
                                    },
                                    {
                                        chipMlc: {
                                            code: UserHistoryCode.Signing,
                                            label: 'Підписання',
                                            badgeCounterAtm: {
                                                count: mockData[UserHistoryCode.Signing],
                                            },
                                        },
                                    },
                                    {
                                        chipMlc: {
                                            code: UserHistoryCode.Sharing,
                                            label: 'Копії документів',
                                            badgeCounterAtm: {
                                                count: mockData[UserHistoryCode.Sharing],
                                            },
                                        },
                                    },
                                ],
                                preselectedCode: UserHistoryCode.Authorization,
                            },
                        },
                    },
                ],
            }

            const result = await userHistoryService.getHistoryScreen(user.identifier)

            expect(result).toEqual(expected)
        })

        it('should return session history screen', async () => {
            jest.spyOn(userSigningHistoryService, 'getHistoryScreenCounts').mockResolvedValueOnce({ authorization: 10, signing: 10 })
            jest.spyOn(userSharingHistoryService, 'countHistory').mockResolvedValueOnce(10)
            jest.spyOn(authService, 'getSessionById').mockResolvedValueOnce(<SessionByIdResponse>{})

            const panelMlc = {
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
            }

            jest.spyOn(userHistoryDataMapper, 'getHistoryScreenNavigationPanelMlc').mockReturnValueOnce(panelMlc)

            const expected: HistoryScreenResponse = {
                topGroup: [
                    {
                        topGroupOrg: {
                            navigationPanelMlc: panelMlc,
                            chipTabsOrg: {
                                items: [
                                    {
                                        chipMlc: {
                                            code: UserHistoryCode.Authorization,
                                            label: 'Авторизації',
                                            badgeCounterAtm: {
                                                count: 10,
                                            },
                                        },
                                    },
                                    {
                                        chipMlc: {
                                            code: UserHistoryCode.Signing,
                                            label: 'Підписання',
                                            badgeCounterAtm: {
                                                count: 10,
                                            },
                                        },
                                    },
                                    {
                                        chipMlc: {
                                            code: UserHistoryCode.Sharing,
                                            label: 'Копії документів',
                                            badgeCounterAtm: {
                                                count: 10,
                                            },
                                        },
                                    },
                                ],
                                preselectedCode: UserHistoryCode.Authorization,
                            },
                        },
                    },
                ],
            }

            const result = await userHistoryService.getHistoryScreen(user.identifier, 'sessionId')

            expect(result).toEqual(expected)
        })
    })

    describe(`method ${userHistoryService.countHistoryByAction.name}`, () => {
        it('should return count of user sharing history', async () => {
            jest.spyOn(userSharingHistoryService, 'countHistory').mockResolvedValueOnce(10)

            expect(await userHistoryService.countHistoryByAction(HistoryAction.Sharing, user.identifier, sessionId)).toBe(10)
            expect(userSharingHistoryService.countHistory).toHaveBeenCalledWith(user.identifier, sessionId)
        })

        it('should return count of user signing history', async () => {
            jest.spyOn(userSigningHistoryService, 'countHistory').mockResolvedValueOnce(10)

            expect(await userHistoryService.countHistoryByAction(HistoryAction.Signing, user.identifier, sessionId)).toBe(10)
            expect(userSigningHistoryService.countHistory).toHaveBeenCalledWith(user.identifier, sessionId)
        })

        it('should throw TypeError if action not found', async () => {
            const action = <HistoryAction>'wrong-action'

            await expect(userHistoryService.countHistoryByAction(action, user.identifier, sessionId)).rejects.toThrow(
                new TypeError(`Unhandled action: ${action}`),
            )
        })
    })

    describe(`method ${userHistoryService.getHistoryItems.name}`, () => {
        it('should return signing history by code with sharing code', async () => {
            const historyResponse = {
                body: [
                    {
                        stubMessageMlc: {
                            icon: 'icon',
                            title: 'title',
                            parameters: [
                                {
                                    type: ContentType.email,
                                    data: {
                                        name: 'name',
                                        alt: 'alt',
                                        resource: 'resource',
                                    },
                                },
                            ],
                        },
                    },
                ],
                total: 1,
            }

            jest.spyOn(userSharingHistoryService, 'getSharingHistoryByAction').mockResolvedValueOnce(historyResponse)
            expect(await userHistoryService.getHistoryItems(UserHistoryCode.Sharing, user.identifier, 1, 1, 'session')).toMatchObject(
                historyResponse,
            )
        })

        it('should return signing history by code with signing code', async () => {
            const stubMessageMlc = {
                icon: 'icon',
                title: 'title',
                parameters: [
                    {
                        type: ContentType.email,
                        data: {
                            name: 'name',
                            alt: 'alt',
                            resource: 'resource',
                        },
                    },
                ],
            }

            jest.spyOn(userSigningHistoryService, 'getSigningHistoryByAction').mockResolvedValueOnce({ body: [], total: 0 })
            jest.spyOn(userHistoryDataMapper, 'getStubMessageByAction').mockReturnValueOnce(stubMessageMlc)

            expect(await userHistoryService.getHistoryItems(UserHistoryCode.Signing, user.identifier, 1, 1, 'session')).toMatchObject({
                body: [{ stubMessageMlc }],
                total: 0,
            })
        })
    })

    describe(`method ${userHistoryService.getHistoryScreenV1.name}`, () => {
        it('should return history screen', async () => {
            jest.spyOn(userSigningHistoryService, 'getHistoryScreenCounts').mockResolvedValueOnce({ authorization: 10, signing: 10 })
            const panel = {
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
            }

            jest.spyOn(userHistoryDataMapper, 'getHistoryScreenNavigationPanel').mockReturnValueOnce(panel)

            expect(await userHistoryService.getHistoryScreenV1(user.identifier)).toMatchObject({
                navigationPanel: panel,
                tabs: {
                    items: [
                        {
                            code: UserHistoryCode.Authorization,
                            name: 'Авторизації',
                            count: 10,
                        },
                        {
                            code: UserHistoryCode.Signing,
                            name: 'Підписання',
                            count: 10,
                        },
                    ],
                    preselectedCode: UserHistoryCode.Authorization,
                },
            })
        })
    })

    describe(`method ${userHistoryService.getHistoryItemById.name}`, () => {
        const navigationPanelMlc = {
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
        }

        const body = [
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
                    parameters: [
                        {
                            type: ContentType.email,
                            data: {
                                name: 'name',
                                alt: 'alt',
                                resource: 'resource',
                            },
                        },
                    ],
                },
            },
            {
                subtitleLabelMlc: {
                    label: 'label',
                },
            },
            {
                textLabelMlc: {
                    text: `Address. \n\nПристрій, з якого здійснено авторизацію: \n${headers.platformType} ${headers.platformVersion}`,
                    parameters: [],
                },
            },
        ]

        it('should return session history item by id with sharing action', async () => {
            const response: HistoryItemResponse = {
                topGroup: [
                    {
                        topGroupOrg: {
                            navigationPanelMlc,
                        },
                    },
                ],
                body,
            }

            jest.spyOn(authService, 'getSessionById').mockResolvedValueOnce(<SessionByIdResponse>{
                platformType: headers.platformType,
                platformVersion: headers.platformVersion,
            })
            jest.spyOn(userSharingHistoryService, 'getSharingHistoryItemById').mockResolvedValueOnce(response)
            expect(
                await userHistoryService.getHistoryItemById(user.identifier, 'itemId', UserHistoryCode.Sharing, sessionId),
            ).toMatchObject(response)
        })

        it('should return session history item by id with signing action', async () => {
            const ratingForm = {
                title: 'string',
                rating: {
                    label: 'label',
                    items: [],
                },
                comment: {
                    label: 'label',
                    hint: 'hint',
                },
                mainButton: 'mainButton',
            }

            const response: HistoryItemResponse = {
                topGroup: [
                    {
                        topGroupOrg: {
                            navigationPanelMlc,
                        },
                    },
                ],
                body,
                ratingForm,
            }

            jest.spyOn(authService, 'getSessionById').mockResolvedValueOnce(<SessionByIdResponse>{
                platformType: headers.platformType,
                platformVersion: headers.platformVersion,
            })
            jest.spyOn(userSigningHistoryService, 'getSigningHistoryItemById').mockResolvedValueOnce(response)
            expect(
                await userHistoryService.getHistoryItemById(user.identifier, 'itemId', UserHistoryCode.Signing, sessionId),
            ).toMatchObject(response)
        })
    })
})
