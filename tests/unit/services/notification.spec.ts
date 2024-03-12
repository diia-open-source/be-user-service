import { ObjectId } from 'bson'

import { MoleculerService } from '@diia-inhouse/diia-app'

import DiiaLogger from '@diia-inhouse/diia-logger'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ActionVersion, SessionType } from '@diia-inhouse/types'

import NotificationService from '@services/notification'

import { MessageTemplateCode, SmsTemplateCode } from '@interfaces/services/notification'

describe(`Service ${NotificationService.name}`, () => {
    const notificationServiceClient = {
        createMessage: jest.fn(),
        createNotificationWithPushes: jest.fn(),
        createNotificationWithPushesByMobileUid: jest.fn(),
        createNotificationsAndSendPushes: jest.fn(),
        getNotificationsList: jest.fn(),
        getNotifications: jest.fn(),
    }
    const testKit = new TestKit()
    const loggerServiceMock = mockInstance(DiiaLogger)

    let mockMoleculerService: MoleculerService
    let notificationService: NotificationService

    beforeEach(() => {
        mockMoleculerService = mockInstance(MoleculerService)
        notificationService = new NotificationService(mockMoleculerService, loggerServiceMock, notificationServiceClient)
    })

    describe('method: `isMessageExists`', () => {
        it('should return true if message exists', async () => {
            const messageId = new ObjectId()

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(true)

            expect(await notificationService.isMessageExists(messageId)).toBeTruthy()
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'Notification',
                {
                    name: 'isMessageExists',
                    actionVersion: ActionVersion.V1,
                },
                {
                    params: { messageId },
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `isSilentActionExists`', () => {
        it('should return true if silent action exists', async () => {
            const actionType = 'actionType'

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(true)

            expect(await notificationService.isSilentActionExists(actionType)).toBeTruthy()
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'Notification',
                {
                    name: 'isSilentActionExists',
                    actionVersion: ActionVersion.V1,
                },
                {
                    params: { actionType },
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `sendSms`', () => {
        it('should return true if sent sms', async () => {
            const phoneNumber = 'phoneNumber'
            const smsCode = SmsTemplateCode.Otp
            const { user } = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const valueToInsert = 'valueToInsert'

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(true)

            expect(await notificationService.sendSms(phoneNumber, smsCode, user, headers, valueToInsert)).toBeTruthy()
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'Notification',
                {
                    name: 'sendSms',
                    actionVersion: ActionVersion.V1,
                },
                {
                    params: { phoneNumber, smsCode, valueToInsert },
                    session: { sessionType: SessionType.User, user },
                    headers,
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `createNotificationWithPushes`', () => {
        it('should return notification', async () => {
            const params = {
                templateCode: MessageTemplateCode.DriverLicenseExpirationLastDay,
                userIdentifier: 'userIdentifier',
            }

            await notificationService.createNotificationWithPushes(params)

            expect(notificationServiceClient.createNotificationWithPushes).toHaveBeenCalledWith(params)
            expect(notificationServiceClient.createNotificationWithPushes).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `createNotificationWithPushesSafe`', () => {
        it('should successfully create notification with pushes', async () => {
            notificationServiceClient.createNotificationWithPushes.mockResolvedValueOnce(true)

            const params = {
                templateCode: MessageTemplateCode.DriverLicenseExpirationLastDay,
                userIdentifier: 'userIdentifier',
            }

            await notificationService.createNotificationWithPushesSafe(params)
            expect(notificationServiceClient.createNotificationWithPushes).toHaveBeenCalledWith(params)
            expect(notificationServiceClient.createNotificationWithPushes).toHaveBeenCalledTimes(1)
        })

        it('should handle error during creating notification', async () => {
            const err = new Error('failed to create notification')

            notificationServiceClient.createNotificationWithPushes.mockRejectedValueOnce(err)

            const params = {
                templateCode: MessageTemplateCode.DriverLicenseExpirationLastDay,
                userIdentifier: 'userIdentifier',
            }

            await notificationService.createNotificationWithPushesSafe(params)

            expect(notificationServiceClient.createNotificationWithPushes).toHaveBeenCalledWith(params)
            expect(notificationServiceClient.createNotificationWithPushes).toHaveBeenCalledTimes(1)
            expect(loggerServiceMock.error).toHaveBeenCalledWith('Failed to exec createNotificationWithPushes', { err, params })
        })
    })

    describe('method: `createNotificationWithPushesByMobileUid`', () => {
        it('should return notification', async () => {
            const params = {
                templateCode: MessageTemplateCode.DriverLicenseExpirationLastDay,
                userIdentifier: 'userIdentifier',
                mobileUid: testKit.session.getHeaders().mobileUid,
            }

            await notificationService.createNotificationWithPushesByMobileUid(params)

            expect(notificationServiceClient.createNotificationWithPushesByMobileUid).toHaveBeenCalledWith(params)
            expect(notificationServiceClient.createNotificationWithPushesByMobileUid).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `createNotificationWithPushesByMobileUidSafe`', () => {
        it('should handle error during creating notification', async () => {
            const err = new Error('failed to create notification')

            notificationServiceClient.createNotificationWithPushesByMobileUid.mockRejectedValueOnce(err)

            jest.spyOn(mockMoleculerService, 'act').mockRejectedValueOnce(err)

            const params = {
                templateCode: MessageTemplateCode.DriverLicenseExpirationLastDay,
                userIdentifier: 'userIdentifier',
                mobileUid: testKit.session.getHeaders().mobileUid,
            }

            await notificationService.createNotificationWithPushesByMobileUidSafe(params)

            expect(notificationServiceClient.createNotificationWithPushesByMobileUid).toHaveBeenCalledWith(params)
            expect(notificationServiceClient.createNotificationWithPushesByMobileUid).toHaveBeenCalledTimes(1)
            expect(loggerServiceMock.error).toHaveBeenCalledWith('Failed to exec createNotificationWithPushesByMobileUid', { err, params })
        })
    })

    describe('method: `setSubscriptionBatches`', () => {
        it('should successfully set subscriptions batches', async () => {
            const campaignEstimation = {
                campaignId: 'campaignId',
                subscriptionBatches: 1,
                targetUsersCount: 1,
            }

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(null)

            await notificationService.setSubscriptionBatches(campaignEstimation)
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'Notification',
                {
                    name: 'setSubscriptionBatches',
                    actionVersion: ActionVersion.V1,
                },
                { params: campaignEstimation },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `topicIdentifierByTotal`', () => {
        it('should return empty string when no topicsBatch', () => {
            const total = 1
            const topicsBatch = 0

            expect(notificationService.topicIdentifierByTotal(total, topicsBatch)).toBe('')
        })

        it('should return topic identifier', () => {
            const total = 50
            const topicsBatch = 4

            const result = `${Math.floor(total / topicsBatch)}`

            expect(notificationService.topicIdentifierByTotal(total, topicsBatch)).toBe(result)
        })
    })
})
