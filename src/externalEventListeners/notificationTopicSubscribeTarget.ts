import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { DocumentType, Gender, PlatformType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { EventPayload } from '@interfaces/externalEventListeners/notificationTopicSubscribeTarget'

export default class NotificationTopicSubscribeTargetEventListener implements EventBusListener {
    private readonly appVersionsValidationSchema: ValidationSchema = {
        minVersion: { type: 'string', optional: true },
        maxVersion: { type: 'string', optional: true },
        versions: {
            type: 'array',
            optional: true,
            items: { type: 'string' },
        },
    }

    constructor(private readonly userProfileService: UserProfileService) {}

    readonly event: ExternalEvent = ExternalEvent.NotificationTopicSubscribeTarget

    readonly validationRules: ValidationSchema = {
        uuid: { type: 'uuid' },
        request: {
            type: 'object',
            props: {
                channel: { type: 'string' },
                topicsBatch: { type: 'number', min: 1000, optional: true },
                campaignId: { type: 'string', optional: true },
                appVersions: {
                    type: 'object',
                    optional: true,
                    props: {
                        [PlatformType.Android]: { type: 'object', optional: true, props: this.appVersionsValidationSchema },
                        [PlatformType.Huawei]: { type: 'object', optional: true, props: this.appVersionsValidationSchema },
                        [PlatformType.iOS]: { type: 'object', optional: true, props: this.appVersionsValidationSchema },
                    },
                },
                filter: {
                    type: 'object',
                    props: {
                        gender: { type: 'string', enum: Object.values(Gender), optional: true },
                        childrenAmount: { type: 'number', optional: true },
                        organizationId: { type: 'string', optional: true },
                        age: {
                            type: 'object',
                            optional: true,
                            props: {
                                from: { type: 'number', optional: true },
                                to: { type: 'number', optional: true },
                            },
                        },
                        address: {
                            type: 'object',
                            optional: true,
                            props: {
                                regionId: { type: 'string' },
                                atuId: { type: 'string', optional: true },
                            },
                        },
                        documents: {
                            type: 'array',
                            optional: true,
                            items: {
                                type: 'object',
                                props: {
                                    type: { type: 'string', enum: Object.values(DocumentType) },
                                },
                            },
                        },
                        userIdentifiersLink: { type: 'string', optional: true },
                        itnsLink: { type: 'string', optional: true },
                    },
                },
            },
        },
    }

    async handler(message: EventPayload): Promise<void> {
        const { channel, filter, topicsBatch, appVersions, campaignId } = message.request

        await this.userProfileService.subscribeUsersToTopic(filter, channel, topicsBatch, appVersions, campaignId)
    }
}
