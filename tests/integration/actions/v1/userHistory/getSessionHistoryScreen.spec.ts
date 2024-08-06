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
    let authService: AuthService

    const testKit = new TestKit()

    beforeAll(async () => {
        app = await getApp()

        getSharingHistoryScreenAction = app.container.build(GetSessionHistoryScreenAction)
        authService = app.container.resolve<AuthService>('authService')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return session history screen with tabs and counts', async () => {
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

        await userSigningHistoryItemModel.insertMany(signingHistoryItems)
        await userSharingHistoryItemModel.create(sharingHistoryItem)

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
                    },
                },
            ],
        })
    })
})
