import { randomUUID } from 'node:crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'
import { Gender, PlatformType } from '@diia-inhouse/types'

import NotificationTopicSubscribeTargetEventListener from '@src/externalEventListeners/notificationTopicSubscribeTarget'

import UserProfileService from '@services/userProfile'

describe(`External event listener ${NotificationTopicSubscribeTargetEventListener.name}`, () => {
    const testKit = new TestKit()

    const userProfileService = mockInstance(UserProfileService)

    const notificationTopicSubscribeTargetEventListener = new NotificationTopicSubscribeTargetEventListener(userProfileService, [])

    it(`should call ${userProfileService.subscribeUsersToTopic.name} with valid arguments`, async () => {
        const filter = { gender: Gender.female, childrenAmount: 5 }
        const channel = randomUUID()
        const topicsBatch = testKit.random.getRandomInt(0, 100_000)
        const campaignId = randomUUID()
        const appVersions = {
            [PlatformType.Android]: { minVersion: '7', maxVersion: '15' },
            [PlatformType.Huawei]: { minVersion: '7', maxVersion: '15' },
            [PlatformType.iOS]: { minVersion: '3', maxVersion: '11' },
        }
        const message = {
            uuid: randomUUID(),
            request: {
                filter,
                channel,
                topicsBatch,
                campaignId,
                appVersions,
            },
        }

        await notificationTopicSubscribeTargetEventListener.handler(message)

        expect(userProfileService.subscribeUsersToTopic).toHaveBeenCalledWith(filter, channel, topicsBatch, appVersions, campaignId)
    })
})
