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
    let testKit: TestKit
    let userHistoryDataMapper: UserHistoryDataMapper

    beforeAll(async () => {
        app = await getApp()

        getHistoryByActionAction = app.container.build(GetHistoryByActionAction)
        testKit = app.container.resolve('testKit')
        userHistoryDataMapper = app.container.resolve('userHistoryDataMapper')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return stubMessageMlc if no signing done', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const action = UserHistoryCode.Signing

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

    it('should return cardMlc for signing item', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const {
            user: { identifier: userIdentifier },
        } = session

        const { platformType, platformVersion } = headers

        const status = UserHistoryItemStatus.Done
        const action = UserHistoryCode.Signing

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

        const createdSigningHistoryItems = await userSigningHistoryItemModel.insertMany(signingHistoryItems)

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
            total: 1,
        })

        // Cleanup
        const createdSigningHistoryItemsIds = createdSigningHistoryItems.map((item) => item._id)

        await userSigningHistoryItemModel.deleteMany({ _id: { $in: createdSigningHistoryItemsIds } })
    })

    it('should return cardMlc for sharing item', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const {
            user: { identifier: userIdentifier },
        } = session

        const status = UserHistoryItemStatus.Done
        const action = UserHistoryCode.Sharing
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

        const createdSharingHistoryItems = await userSharingHistoryItemModel.insertMany(sharingHistoryItems)

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
            total: 1,
        })

        // Cleanup
        const createdSharingHistoryItemsIds = createdSharingHistoryItems.map((item) => item._id)

        await userSharingHistoryItemModel.deleteMany({ _id: { $in: createdSharingHistoryItemsIds } })
    })
})
