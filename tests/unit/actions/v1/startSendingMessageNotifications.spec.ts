import { mongo } from '@diia-inhouse/db'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { EventBus, Task } from '@diia-inhouse/diia-queue'
import { BadRequestError, ModelNotFoundError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { PlatformType } from '@diia-inhouse/types'

import StartSendingMessageNotificationsAction from '@actions/v1/startSendingMessageNotifications'

import DistributionService from '@services/distribution'
import NotificationService from '@services/notification'

import { InternalEvent } from '@interfaces/queue'
import { ServiceTask } from '@interfaces/tasks'

describe(`Action ${StartSendingMessageNotificationsAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const loggerMock = mockInstance(DiiaLogger)
    const distributionServiceMock = mockInstance(DistributionService)
    const notificationServiceMock = mockInstance(NotificationService)
    const taskMock = mockInstance(Task)
    const eventBusMock = mockInstance(EventBus)

    const startSendingMessageNotificationsAction = new StartSendingMessageNotificationsAction(
        distributionServiceMock,
        notificationServiceMock,
        taskMock,
        eventBusMock,
        loggerMock,
    )

    describe('method `handler`', () => {
        const messageObjectId = new mongo.ObjectId()
        const messageId = messageObjectId.toString()
        const distributionId = new mongo.ObjectId()
        const args = {
            params: {
                messageId,
                platformTypes: [PlatformType.Android, PlatformType.Huawei],
                useExpirations: false,
            },
            session: testKit.session.getUserSession(),
            headers,
        }

        it('should throw ModelNotFoundError if message do not exist', async () => {
            jest.spyOn(notificationServiceMock, 'isMessageExists').mockResolvedValueOnce(false)

            await expect(startSendingMessageNotificationsAction.handler(args)).rejects.toEqual(new ModelNotFoundError('Message', messageId))

            expect(notificationServiceMock.isMessageExists).toHaveBeenCalledWith(messageObjectId)
        })

        it('should throw BadRequestError if not found available platform type to send notifications', async () => {
            jest.spyOn(notificationServiceMock, 'isMessageExists').mockResolvedValueOnce(true)
            jest.spyOn(distributionServiceMock, 'createOrUpdate').mockResolvedValueOnce([new mongo.ObjectId(), []])

            await expect(startSendingMessageNotificationsAction.handler(args)).rejects.toEqual(
                new BadRequestError('No available platform type to send notifications'),
            )

            expect(notificationServiceMock.isMessageExists).toHaveBeenCalledWith(messageObjectId)
            expect(distributionServiceMock.createOrUpdate).toHaveBeenCalledWith(messageObjectId, args.params.platformTypes)
        })

        it('should throw Error if failed to publish task to the queue', async () => {
            jest.spyOn(notificationServiceMock, 'isMessageExists').mockResolvedValueOnce(true)
            jest.spyOn(distributionServiceMock, 'createOrUpdate').mockResolvedValueOnce([
                distributionId,
                [PlatformType.Android, PlatformType.Huawei],
            ])
            jest.spyOn(taskMock, 'publish').mockResolvedValueOnce(false)

            await expect(startSendingMessageNotificationsAction.handler(args)).rejects.toEqual(
                new Error('Failed to publish task to the queue'),
            )

            expect(notificationServiceMock.isMessageExists).toHaveBeenCalledWith(messageObjectId)
            expect(distributionServiceMock.createOrUpdate).toHaveBeenCalledWith(messageObjectId, args.params.platformTypes)
            expect(taskMock.publish).toHaveBeenCalledWith(ServiceTask.CREATE_NOTIFICATIONS_BATCHES, {
                messageId: messageObjectId,
                platformTypes: [PlatformType.Android, PlatformType.Huawei],
                useExpirations: args.params.useExpirations,
            })
        })

        it('should fail to publish event', async () => {
            jest.spyOn(notificationServiceMock, 'isMessageExists').mockResolvedValueOnce(true)
            jest.spyOn(distributionServiceMock, 'createOrUpdate').mockResolvedValueOnce([
                distributionId,
                [PlatformType.Android, PlatformType.Huawei],
            ])
            jest.spyOn(taskMock, 'publish').mockResolvedValueOnce(true)
            jest.spyOn(eventBusMock, 'publish').mockResolvedValueOnce(false)

            expect(await startSendingMessageNotificationsAction.handler(args)).toMatchObject({ distributionId })

            expect(notificationServiceMock.isMessageExists).toHaveBeenCalledWith(messageObjectId)
            expect(distributionServiceMock.createOrUpdate).toHaveBeenCalledWith(messageObjectId, args.params.platformTypes)
            expect(taskMock.publish).toHaveBeenCalledWith(ServiceTask.CREATE_NOTIFICATIONS_BATCHES, {
                messageId: messageObjectId,
                platformTypes: [PlatformType.Android, PlatformType.Huawei],
                useExpirations: args.params.useExpirations,
            })
            expect(loggerMock.error).toHaveBeenCalledWith(`Failed to publish event [${InternalEvent.UserSendMassAnonymousNotifications}]`)
        })

        it('should successfully publish event', async () => {
            jest.spyOn(notificationServiceMock, 'isMessageExists').mockResolvedValueOnce(true)
            jest.spyOn(distributionServiceMock, 'createOrUpdate').mockResolvedValueOnce([
                distributionId,
                [PlatformType.Android, PlatformType.Huawei],
            ])
            jest.spyOn(taskMock, 'publish').mockResolvedValueOnce(true)
            jest.spyOn(eventBusMock, 'publish').mockResolvedValueOnce(true)

            expect(await startSendingMessageNotificationsAction.handler(args)).toMatchObject({ distributionId })

            expect(notificationServiceMock.isMessageExists).toHaveBeenCalledWith(messageObjectId)
            expect(distributionServiceMock.createOrUpdate).toHaveBeenCalledWith(messageObjectId, args.params.platformTypes)
            expect(taskMock.publish).toHaveBeenCalledWith(ServiceTask.CREATE_NOTIFICATIONS_BATCHES, {
                messageId: messageObjectId,
                platformTypes: [PlatformType.Android, PlatformType.Huawei],
                useExpirations: args.params.useExpirations,
            })
            expect(loggerMock.error).toHaveBeenCalledWith(`Failed to publish event [${InternalEvent.UserSendMassAnonymousNotifications}]`)
        })
    })
})
