/* eslint-disable no-await-in-loop */
import { ObjectId } from 'bson'

import { EventBus, InternalEvent, TaskListener } from '@diia-inhouse/diia-queue'
import { Logger, PlatformType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { AppConfig } from '@interfaces/config'
import { UserIdentifiersWithLastId } from '@interfaces/services/userProfile'
import { ServiceTask } from '@interfaces/tasks'
import { EventPayload } from '@interfaces/tasks/createNotificationsBatches'

export default class CreateNotificationsBatchesTask implements TaskListener {
    private readonly notificationsBatchSize: number

    constructor(
        private readonly userProfileService: UserProfileService,

        private readonly config: AppConfig,
        private readonly eventBus: EventBus,
        private readonly logger: Logger,
    ) {
        this.notificationsBatchSize = this.config.tasks.createNotificationsBatches.notificationsBatchSize
    }

    readonly name: string = ServiceTask.CREATE_NOTIFICATIONS_BATCHES

    readonly validationRules: ValidationSchema = {
        messageId: { type: 'objectId' },
        platformTypes: {
            type: 'array',
            items: { type: 'string', enum: Object.values(PlatformType) },
        },
        useExpirations: { type: 'boolean', optional: true },
    }

    async handler(payload: EventPayload): Promise<void> {
        const { messageId, platformTypes, useExpirations } = payload

        let skip = 0
        let lastId: ObjectId | undefined
        // eslint-disable-next-line no-constant-condition
        while (true) {
            this.logger.debug('Start aggregating userIdentifiers', { skip })
            const start: number = Date.now()
            const { userIdentifiers, nextLastId }: UserIdentifiersWithLastId =
                await this.userProfileService.getUserIdentifiersByPlatformTypes(platformTypes, this.notificationsBatchSize, lastId)
            const end: number = Date.now()
            const queryItemsTime: number = end - start

            this.logger.debug('Ended aggregating userIdentifiers', { identifiers: userIdentifiers.length, queryItemsTime, skip })
            if (!userIdentifiers.length || !nextLastId) {
                this.logger.debug('Ended aggregating notifications batches')

                break
            }

            const publishResult: boolean = await this.eventBus.publish(InternalEvent.UserSendMassNotifications, {
                messageId,
                platformTypes,
                useExpirations,
                userIdentifiers,
            })
            if (publishResult) {
                this.logger.debug('Successfully published event to send batch notifications', { skip })
            } else {
                this.logger.error('Failed to publish event to send batch notifications', { skip, lastId })
            }

            skip += this.notificationsBatchSize
            lastId = nextLastId
        }

        this.logger.info('Creating notification batches ended')
    }
}
