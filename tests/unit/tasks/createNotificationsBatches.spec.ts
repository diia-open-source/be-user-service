import { randomUUID } from 'crypto'

import { ObjectId } from 'bson'

import Logger from '@diia-inhouse/diia-logger'
import { EventBus, InternalEvent } from '@diia-inhouse/diia-queue'
import { mockInstance } from '@diia-inhouse/test'
import { PlatformType } from '@diia-inhouse/types'

import CreateNotificationsBatchesTask from '@src/tasks/createNotificationsBatches'

import UserProfileService from '@services/userProfile'

import { AppConfig } from '@interfaces/config'
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
            { messageId: new ObjectId(), useExpirations: false, platformTypes: [PlatformType.Android, PlatformType.Huawei] },
            [{ userIdentifiers: [...Array(notificationsBatchSize - 1)].map(() => randomUUID()), nextLastId: new ObjectId() }],
        ],
        [
            `multiple ${InternalEvent.UserSendMassNotifications} event when count of found user identifiers is greater than notificationsBatchSize`,
            { messageId: new ObjectId(), useExpirations: false, platformTypes: [PlatformType.Android, PlatformType.Huawei] },
            [...Array(5)].map(() => ({
                userIdentifiers: [...Array(notificationsBatchSize)].map(() => randomUUID()),
                nextLastId: new ObjectId(),
            })),
        ],
    ])(`should publish %s`, async (_msg, params, getUserIdentifiersResponses: UserIdentifiersWithLastId[]) => {
        const userProfileService = mockInstance(UserProfileService)
        const createNotificationsBatchesTask = new CreateNotificationsBatchesTask(userProfileService, config, mockEventBus, logger)
        const { messageId, useExpirations, platformTypes } = params

        for (let i = 0; i < getUserIdentifiersResponses.length; i++) {
            jest.spyOn(userProfileService, 'getUserIdentifiersByPlatformTypes').mockResolvedValueOnce(getUserIdentifiersResponses[i])
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
        const messageId = new ObjectId()
        const useExpirations = true
        const platformTypes = [PlatformType.Android, PlatformType.Huawei]
        const params = { messageId, useExpirations, platformTypes }
        const nextLastId = new ObjectId()

        jest.spyOn(userProfileService, 'getUserIdentifiersByPlatformTypes').mockResolvedValueOnce({
            userIdentifiers: [...Array(notificationsBatchSize - 1)].map(() => randomUUID()),
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
