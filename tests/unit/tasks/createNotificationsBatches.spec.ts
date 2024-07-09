import { randomUUID } from 'node:crypto'

import { mongo } from '@diia-inhouse/db'
import Logger from '@diia-inhouse/diia-logger'
import { EventBus } from '@diia-inhouse/diia-queue'
import { mockInstance } from '@diia-inhouse/test'
import { PlatformType } from '@diia-inhouse/types'

import CreateNotificationsBatchesTask from '@src/tasks/createNotificationsBatches'

import UserProfileService from '@services/userProfile'

import { AppConfig } from '@interfaces/config'
import { InternalEvent } from '@interfaces/queue'
import { UserIdentifiersWithLastId } from '@interfaces/services/userProfile'

const mockEventBus = <EventBus>(<unknown>{
    publish: jest.fn(),
})

describe(`Task ${CreateNotificationsBatchesTask.name}`, () => {
    const notificationsBatchSize = 10
    const logger = mockInstance(Logger)
    const config = <AppConfig>{
        tasks: {
            createNotificationsBatches: {
                notificationsBatchSize,
            },
        },
    }

    it.each([
        [
            `one ${InternalEvent.UserSendMassNotifications} event when count of found user identifiers is less than notificationsBatchSize`,
            { messageId: new mongo.ObjectId(), useExpirations: false, platformTypes: [PlatformType.Android, PlatformType.Huawei] },
            [
                {
                    userIdentifiers: Array.from({ length: notificationsBatchSize - 1 }).map(() => randomUUID()),
                    nextLastId: new mongo.ObjectId(),
                },
            ],
        ],
        [
            `multiple ${InternalEvent.UserSendMassNotifications} event when count of found user identifiers is greater than notificationsBatchSize`,
            { messageId: new mongo.ObjectId(), useExpirations: false, platformTypes: [PlatformType.Android, PlatformType.Huawei] },
            Array.from({ length: 5 }).map(() => ({
                userIdentifiers: Array.from({ length: notificationsBatchSize }).map(() => randomUUID()),
                nextLastId: new mongo.ObjectId(),
            })),
        ],
    ])(`should publish %s`, async (_msg, params, getUserIdentifiersResponses: UserIdentifiersWithLastId[]) => {
        const userProfileService = mockInstance(UserProfileService)
        const createNotificationsBatchesTask = new CreateNotificationsBatchesTask(userProfileService, config, mockEventBus, logger)
        const { messageId, useExpirations, platformTypes } = params

        for (const getUserIdentifiersResponse of getUserIdentifiersResponses) {
            jest.spyOn(userProfileService, 'getUserIdentifiersByPlatformTypes').mockResolvedValueOnce(getUserIdentifiersResponse)
        }

        jest.spyOn(userProfileService, 'getUserIdentifiersByPlatformTypes').mockResolvedValueOnce({ userIdentifiers: [] })
        jest.spyOn(mockEventBus, 'publish').mockResolvedValue(true)

        await createNotificationsBatchesTask.handler(params)

        for (let i = 0; i < getUserIdentifiersResponses.length; i++) {
            expect(userProfileService.getUserIdentifiersByPlatformTypes).toHaveBeenNthCalledWith(
                i + 1,
                platformTypes,
                notificationsBatchSize,
                getUserIdentifiersResponses[i - 1]?.nextLastId,
            )
            expect(mockEventBus.publish).toHaveBeenNthCalledWith(i + 1, InternalEvent.UserSendMassNotifications, {
                messageId,
                platformTypes,
                useExpirations,
                userIdentifiers: getUserIdentifiersResponses[i].userIdentifiers,
            })
        }
    })

    it('should log error if result was not returned from publish', async () => {
        const userProfileService = mockInstance(UserProfileService)
        const createNotificationsBatchesTask = new CreateNotificationsBatchesTask(userProfileService, config, mockEventBus, logger)
        const messageId = new mongo.ObjectId()
        const useExpirations = true
        const platformTypes = [PlatformType.Android, PlatformType.Huawei]
        const params = { messageId, useExpirations, platformTypes }
        const nextLastId = new mongo.ObjectId()

        jest.spyOn(userProfileService, 'getUserIdentifiersByPlatformTypes').mockResolvedValueOnce({
            userIdentifiers: Array.from({ length: notificationsBatchSize - 1 }).map(() => randomUUID()),
            nextLastId,
        })
        jest.spyOn(userProfileService, 'getUserIdentifiersByPlatformTypes').mockResolvedValueOnce({ userIdentifiers: [] })
        jest.spyOn(mockEventBus, 'publish').mockResolvedValue(false)

        await createNotificationsBatchesTask.handler(params)

        expect(logger.error).toHaveBeenNthCalledWith(1, 'Failed to publish event to send batch notifications', {
            skip: 0,
            lastId: undefined,
        })
    })
})
