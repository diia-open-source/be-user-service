import { randomUUID } from 'node:crypto'

import TestKit from '@diia-inhouse/test'

import GetHistoryScreenAction from '@src/actions/v1/userHistory/getHistoryScreen'

import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import { getApp } from '@tests/utils/getApp'

import { UserSigningHistoryItem } from '@interfaces/models/userSigningHistoryItem'
import { UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryScreenAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getHistoryScreenAction: GetHistoryScreenAction
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()
        getHistoryScreenAction = app.container.build(GetHistoryScreenAction)
        testKit = app.container.resolve('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return preselected code equaled Authorization and count Authorization and Signing history items', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const {
            user: { identifier: userIdentifier },
        } = session

        const { platformType, platformVersion } = headers

        const authorizationCount = 2
        const signingCount = 1

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

        const createdSigningHistoryItems = await userSigningHistoryItemModel.insertMany(signingHistoryItems)

        // Act
        const result = await getHistoryScreenAction.handler({ session, headers, params: {} })

        // Assert
        expect(result).toEqual(
            expect.objectContaining({
                tabs: {
                    items: [
                        {
                            code: UserHistoryCode.Authorization,
                            count: authorizationCount,
                            name: 'Авторизації',
                        },
                        {
                            code: UserHistoryCode.Signing,
                            count: signingCount,
                            name: 'Підписання',
                        },
                    ],
                    preselectedCode: UserHistoryCode.Authorization,
                },
            }),
        )

        // Cleanup
        const createdSigningHistoryItemsIds = createdSigningHistoryItems.map((item) => item._id)

        await userSigningHistoryItemModel.deleteMany({ _id: { $in: createdSigningHistoryItemsIds } })
    })
})
