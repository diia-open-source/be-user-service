import { EventBusListener } from '@diia-inhouse/diia-queue'
import { Gender, PlatformType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { EventPayload } from '@interfaces/externalEventListeners/notificationSendTarget'
import { ExternalEvent } from '@interfaces/queue'

export default class NotificationSendTargetEventListener implements EventBusListener {
    private readonly appVersionsValidationSchema: ValidationSchema = {
        minVersion: { type: 'string', optional: true },
        maxVersion: { type: 'string', optional: true },
        versions: {
            type: 'array',
            optional: true,
            items: { type: 'string' },
        },
    }

    constructor(
        private readonly userProfileService: UserProfileService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            uuid: { type: 'uuid' },
            request: {
                type: 'object',
                props: {
                    templateCode: { type: 'string' },
                    resourceId: { type: 'string', optional: true },
                    templateParams: {
                        type: 'object',
                        optional: true,
                        props: {
                            title: { type: 'object', optional: true },
                            shortText: { type: 'object', optional: true },
                            fullText: { type: 'object', optional: true },
                        },
                    },
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
                                        type: { type: 'string', enum: this.documentTypes },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }

    readonly event: ExternalEvent = ExternalEvent.NotificationSendTarget

    readonly validationRules: ValidationSchema

    async handler(message: EventPayload): Promise<void> {
        const { filter, templateCode, resourceId, templateParams, appVersions } = message.request

        await this.userProfileService.notifyUsers(filter, templateCode, resourceId, templateParams, appVersions)
    }
}
