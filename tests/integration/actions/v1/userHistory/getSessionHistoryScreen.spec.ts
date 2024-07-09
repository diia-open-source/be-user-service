import { randomUUID } from 'node:crypto'

import { mongo } from '@diia-inhouse/db'
import TestKit from '@diia-inhouse/test'

import GetSessionHistoryScreenAction from '@src/actions/v1/userHistory/getSessionHistoryScreen'

import AuthService from '@services/auth'

import userSharingHistoryItemModel from '@models/userSharingHistoryItem'
import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/userHistory/getSessionHistoryScreen'
import { UserSharingHistoryItem } from '@interfaces/models/userSharingHistoryItem'
import { UserSigningHistoryItem } from '@interfaces/models/userSigningHistoryItem'
import { UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetSessionHistoryScreenAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getSharingHistoryScreenAction: GetSessionHistoryScreenAction
    let testKit: TestKit
    let authService: AuthService

    beforeAll(async () => {
        app = await getApp()

        getSharingHistoryScreenAction = app.container.build(GetSessionHistoryScreenAction)
        testKit = app.container.resolve('testKit')
        authService = app.container.resolve<AuthService>('authService')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return sharing history screen with counts', async () => {
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

        const sessionId = randomUUID()
        const authorizationCount = 2
        const signingCount = 1
        const sharingCount = 1

        const signingHistoryItems: UserSigningHistoryItem[] = ['authDiiaId', 'authDiiaId', 'hashedFilesSigningDiiaId'].map((action) => ({
            userIdentifier,
            sessionId,
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

        signingHistoryItems.push({
            userIdentifier,
            sessionId: randomUUID(),
            resourceId: randomUUID(),
            platformType,
            platformVersion,
            action: 'hashedFilesSigningDiiaId',
            status: UserHistoryItemStatus.Done,
            statusHistory: [
                {
                    status: UserHistoryItemStatus.Done,
                    date: new Date(),
                },
            ],
            documents: ['someDocument'],
            date: new Date(),
        })

        const sharingHistoryItem: UserSharingHistoryItem = {
            userIdentifier,
            sessionId,
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

        const createdSigningHistoryItems = await userSigningHistoryItemModel.insertMany(signingHistoryItems)
        const createdSharingHistoryItem = await userSharingHistoryItemModel.create(sharingHistoryItem)

        // Act
        const result = await getSharingHistoryScreenAction.handler({ session, headers, params: { sessionId } })

        // Assert
        expect(result).toEqual<ActionResult>({
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc: {
                            label: expect.any(String),
                            ellipseMenu: expect.any(Array),
                        },
                        chipTabsOrg: {
                            items: [
                                {
                                    code: UserHistoryCode.Authorization,
                                    count: authorizationCount,
                                    label: 'Авторизації',
                                    chipMlc: { code: UserHistoryCode.Authorization, label: 'Авторизації' },
                                },
                                {
                                    code: UserHistoryCode.Signing,
                                    count: signingCount,
                                    label: 'Підписання',
                                    chipMlc: { code: UserHistoryCode.Signing, label: 'Підписання' },
                                },
                                {
                                    code: UserHistoryCode.Sharing,
                                    count: sharingCount,
                                    label: 'Шеринг документів',
                                    chipMlc: { code: UserHistoryCode.Sharing, label: 'Шеринг документів' },
                                },
                            ],
                            preselectedCode: UserHistoryCode.Authorization,
                        },
                    },
                },
            ],
        })

        // Cleanup
        const createdSigningHistoryItemsIds = createdSigningHistoryItems.map((item) => item._id)

        await userSigningHistoryItemModel.deleteMany({ _id: { $in: createdSigningHistoryItemsIds } })
        await userSharingHistoryItemModel.deleteOne({ _id: createdSharingHistoryItem._id })
    })
})
