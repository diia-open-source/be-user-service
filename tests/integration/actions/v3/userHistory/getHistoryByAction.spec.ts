import { randomUUID } from 'node:crypto'

import { mongo } from '@diia-inhouse/db'
import TestKit from '@diia-inhouse/test'
import { ButtonState } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import GetHistoryByActionAction from '@src/actions/v3/userHistory/getHistoryByAction'

import userSharingHistoryItemModel from '@models/userSharingHistoryItem'
import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v3/userHistory/getHistoryByAction'
import { UserSharingHistoryItem } from '@interfaces/models/userSharingHistoryItem'
import { UserSigningHistoryItem } from '@interfaces/models/userSigningHistoryItem'
import { UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryByActionAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>

    let getHistoryByActionAction: GetHistoryByActionAction
    let userHistoryDataMapper: UserHistoryDataMapper

    const testKit = new TestKit()

    beforeAll(async () => {
        app = await getApp()

        getHistoryByActionAction = app.container.build(GetHistoryByActionAction)
        userHistoryDataMapper = app.container.resolve('userHistoryDataMapper')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    describe(`${UserHistoryCode.Signing}`, () => {
        const action = UserHistoryCode.Signing

        it('should return stub message if no items', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()
            const session = testKit.session.getUserSession()

            // Act
            const result = await getHistoryByActionAction.handler({
                session,
                headers,
                params: {
                    action,
                },
            })

            // Assert
            expect(result).toEqual<ActionResult>({
                body: [{ stubMessageMlc: userHistoryDataMapper.getStubMessageByAction(action) }],
                total: 0,
            })
        })

        it('should return cards', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()
            const session = testKit.session.getUserSession()

            const {
                user: { identifier: userIdentifier },
            } = session

            const { platformType, platformVersion } = headers

            const status = UserHistoryItemStatus.Done

            const signingHistoryItems: UserSigningHistoryItem[] = [
                {
                    userIdentifier,
                    sessionId: randomUUID(),
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

            await userSigningHistoryItemModel.insertMany(signingHistoryItems)

            // Act
            const result = await getHistoryByActionAction.handler({
                session,
                headers,
                params: {
                    action,
                },
            })

            // Assert
            expect(result).toEqual<ActionResult>({
                body: [
                    {
                        paginationListOrg: {
                            componentId: 'pagination_list_org',
                            items: [
                                {
                                    cardMlc: {
                                        id: signingHistoryItems[0].resourceId,
                                        chipStatusAtm: {
                                            code: UserHistoryItemStatus.Done,
                                            name: userHistoryDataMapper.getHistoryItemStatusNameByActionAndStatus(action, status),
                                            type: userHistoryDataMapper.getHistoryStatusChipTypeByStatus(status),
                                        },
                                        title: signingHistoryItems[0].recipient!.name,
                                        subtitles: [],
                                        description: signingHistoryItems[0].recipient!.address,
                                        botLabel: utils.formatDate(signingHistoryItems[0].date, userHistoryDataMapper.dateFormat),
                                        btnPrimaryAdditionalAtm: {
                                            label: 'Детальніше',
                                            state: ButtonState.enabled,
                                            action: {
                                                type: 'historyItemsStatus',
                                            },
                                        },
                                    },
                                },
                            ],
                            limit: 20,
                        },
                    },
                ],
                total: 1,
            })
        })
    })

    describe(`${UserHistoryCode.Authorization}`, () => {
        const action = UserHistoryCode.Authorization

        it('should return stub message if no items', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()
            const session = testKit.session.getUserSession()

            // Act
            const result = await getHistoryByActionAction.handler({
                session,
                headers,
                params: {
                    action,
                },
            })

            // Assert
            expect(result).toEqual<ActionResult>({
                body: [{ stubMessageMlc: userHistoryDataMapper.getStubMessageByAction(action) }],
                total: 0,
            })
        })

        it('should return cards', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()
            const session = testKit.session.getUserSession()

            const {
                user: { identifier: userIdentifier },
            } = session

            const { platformType, platformVersion } = headers

            const status = UserHistoryItemStatus.Done

            const signingHistoryItems: UserSigningHistoryItem[] = [
                {
                    userIdentifier,
                    sessionId: randomUUID(),
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

            await userSigningHistoryItemModel.insertMany(signingHistoryItems)

            // Act
            const result = await getHistoryByActionAction.handler({
                session,
                headers,
                params: {
                    action,
                },
            })

            // Assert
            expect(result).toEqual<ActionResult>({
                body: [
                    {
                        paginationListOrg: {
                            componentId: 'pagination_list_org',
                            items: [
                                {
                                    cardMlc: {
                                        id: signingHistoryItems[0].resourceId,
                                        chipStatusAtm: {
                                            code: UserHistoryItemStatus.Done,
                                            name: userHistoryDataMapper.getHistoryItemStatusNameByActionAndStatus(action, status),
                                            type: userHistoryDataMapper.getHistoryStatusChipTypeByStatus(status),
                                        },
                                        title: signingHistoryItems[0].recipient!.name,
                                        subtitles: [],
                                        description: signingHistoryItems[0].recipient!.address,
                                        botLabel: utils.formatDate(signingHistoryItems[0].date, userHistoryDataMapper.dateFormat),
                                        btnPrimaryAdditionalAtm: {
                                            label: 'Детальніше',
                                            state: ButtonState.enabled,
                                            action: {
                                                type: 'historyItemsStatus',
                                            },
                                        },
                                    },
                                },
                            ],
                            limit: 20,
                        },
                    },
                ],
                total: 1,
            })
        })
    })

    describe(`${UserHistoryCode.Sharing}`, () => {
        const action = UserHistoryCode.Sharing

        it('should return stub message if no items', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()
            const session = testKit.session.getUserSession()

            // Act
            const result = await getHistoryByActionAction.handler({
                session,
                headers,
                params: {
                    action,
                },
            })

            // Assert
            expect(result).toEqual<ActionResult>({
                body: [{ stubMessageMlc: userHistoryDataMapper.getStubMessageByAction(action) }],
                total: 0,
            })
        })

        it('should return cards by sessionId', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()
            const session = testKit.session.getUserSession()

            const {
                user: { identifier: userIdentifier },
            } = session

            const status = UserHistoryItemStatus.Done
            const sessionId = randomUUID()

            const sharingHistoryItems: UserSharingHistoryItem[] = [
                {
                    userIdentifier,
                    sessionId,
                    sharingId: randomUUID(),
                    status,
                    statusHistory: [{ status, date: new Date() }],
                    documents: [],
                    date: new Date(),
                    acquirer: {
                        id: new mongo.ObjectId(),
                        name: 'name',
                        address: 'address',
                    },
                },
            ]

            await userSharingHistoryItemModel.insertMany(sharingHistoryItems)

            // Act
            const result = await getHistoryByActionAction.handler({
                session,
                headers,
                params: {
                    action,
                    session: sessionId,
                },
            })

            // Assert
            expect(result).toEqual<ActionResult>({
                body: [
                    {
                        paginationListOrg: {
                            componentId: 'pagination_list_org',
                            items: [
                                {
                                    cardMlc: {
                                        id: sharingHistoryItems[0].sharingId,
                                        chipStatusAtm: {
                                            code: UserHistoryItemStatus.Done,
                                            name: userHistoryDataMapper.getHistoryItemStatusNameByActionAndStatus(action, status),
                                            type: userHistoryDataMapper.getHistoryStatusChipTypeByStatus(status),
                                        },
                                        title: sharingHistoryItems[0].acquirer.name,
                                        subtitles: [],
                                        description: sharingHistoryItems[0].acquirer.address,
                                        botLabel: utils.formatDate(sharingHistoryItems[0].date, userHistoryDataMapper.dateFormat),
                                        btnPrimaryAdditionalAtm: {
                                            label: 'Детальніше',
                                            state: ButtonState.enabled,
                                            action: {
                                                type: 'historyItemsStatus',
                                            },
                                        },
                                    },
                                },
                            ],
                            limit: 20,
                        },
                    },
                ],
                total: 1,
            })
        })
    })
})
