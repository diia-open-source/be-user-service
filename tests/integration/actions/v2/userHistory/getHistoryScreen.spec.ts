import { randomUUID } from 'node:crypto'

import { mongo } from '@diia-inhouse/db'
import TestKit from '@diia-inhouse/test'

import GetHistoryScreenAction from '@src/actions/v2/userHistory/getHistoryScreen'

import userSharingHistoryItemModel from '@models/userSharingHistoryItem'
import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import { getApp } from '@tests/utils/getApp'

import { UserSharingHistoryItem } from '@interfaces/models/userSharingHistoryItem'
import { UserSigningHistoryItem } from '@interfaces/models/userSigningHistoryItem'
import { UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryScreenAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>

    let getHistoryScreenAction: GetHistoryScreenAction

    const testKit = new TestKit()

    beforeAll(async () => {
        app = await getApp()

        getHistoryScreenAction = app.container.build(GetHistoryScreenAction)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return history screen with tabs and counts', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const {
            user: { identifier: userIdentifier },
        } = session

        const { platformType, platformVersion } = headers

        const authorizationCount = 2
        const signingCount = 1
        const sharingCount = 1

        const signingHistoryItems: UserSigningHistoryItem[] = ['authDiiaId', 'authDiiaId', 'hashedFilesSigningDiiaId'].map((action) => ({
            userIdentifier,
            sessionId: randomUUID(),
            resourceId: randomUUID(),
            platformType,
            platformVersion,
            action,
            status: UserHistoryItemStatus.Done,
            statusHistory: [
                {
                    status: UserHistoryItemStatus.Done,
                    date: new Date(),
                },
            ],
            documents: ['someDocument'],
            date: new Date(),
        }))

        const sharingHistoryItem: UserSharingHistoryItem = {
            userIdentifier,
            sessionId: randomUUID(),
            sharingId: randomUUID(),
            status: UserHistoryItemStatus.Processing,
            statusHistory: [{ status: UserHistoryItemStatus.Processing, date: new Date() }],
            documents: [],
            date: new Date(),
            acquirer: {
                id: new mongo.ObjectId(),
                name: 'name',
                address: 'address',
            },
        }

        await userSigningHistoryItemModel.insertMany(signingHistoryItems)
        await userSharingHistoryItemModel.create(sharingHistoryItem)

        // Act
        const result = await getHistoryScreenAction.handler({ session, headers, params: {} })

        // Assert
        expect(result.topGroup?.[0].topGroupOrg).toEqual(
            expect.objectContaining({
                chipTabsOrg: {
                    items: [
                        {
                            chipMlc: {
                                code: UserHistoryCode.Authorization,
                                label: 'Авторизації',
                                badgeCounterAtm: {
                                    count: authorizationCount,
                                },
                            },
                        },
                        {
                            chipMlc: {
                                code: UserHistoryCode.Signing,
                                label: 'Підписання',
                                badgeCounterAtm: {
                                    count: signingCount,
                                },
                            },
                        },
                        {
                            chipMlc: {
                                code: UserHistoryCode.Sharing,
                                label: 'Копії документів',
                                badgeCounterAtm: {
                                    count: sharingCount,
                                },
                            },
                        },
                    ],
                    preselectedCode: UserHistoryCode.Authorization,
                },
            }),
        )
    })
})
