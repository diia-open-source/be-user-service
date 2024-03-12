import { ObjectId } from 'bson'

import { AppAction } from '@diia-inhouse/diia-app'

import { EventBus, InternalEvent, Task } from '@diia-inhouse/diia-queue'
import { BadRequestError, ModelNotFoundError } from '@diia-inhouse/errors'
import { ActionVersion, Logger, PlatformType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DistributionService from '@services/distribution'
import NotificationService from '@services/notification'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/startSendingMessageNotifications'
import { ServiceTask } from '@interfaces/tasks'

export default class StartSendingMessageNotificationsAction implements AppAction {
    constructor(
        private readonly distributionService: DistributionService,
        private readonly notificationService: NotificationService,

        private readonly task: Task,
        private readonly eventBus: EventBus,
        private readonly logger: Logger,
    ) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'startSendingMessageNotifications'

    readonly validationRules: ValidationSchema = {
        messageId: { type: 'objectId' },
        platformTypes: {
            type: 'array',
            items: { type: 'string', enum: Object.values(PlatformType) },
            optional: true,
        },
        useExpirations: { type: 'boolean', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { messageId, platformTypes, useExpirations } = args.params

        const message: boolean = await this.notificationService.isMessageExists(messageId)
        if (!message) {
            throw new ModelNotFoundError('Message', messageId)
        }

        const [distributionId, platformTypesToSend]: [ObjectId, PlatformType[]] = await this.distributionService.createOrUpdate(
            messageId,
            platformTypes,
        )
        if (!platformTypesToSend.length) {
            throw new BadRequestError('No available platform type to send notifications')
        }

        const publishResultNotificationBatches: boolean = await this.task.publish(ServiceTask.CREATE_NOTIFICATIONS_BATCHES, {
            messageId,
            platformTypes: platformTypesToSend,
            useExpirations,
        })
        if (!publishResultNotificationBatches) {
            throw Error('Failed to publish task to the queue')
        }

        const publishResultMassAnonymous: boolean = await this.eventBus.publish(InternalEvent.UserSendMassAnonymousNotifications, {
            messageId,
            platformTypes: platformTypesToSend,
            useExpirations,
        })
        if (publishResultMassAnonymous) {
            this.logger.debug(`Successfully published event [${InternalEvent.UserSendMassAnonymousNotifications}]`)
        } else {
            this.logger.error(`Failed to publish event [${InternalEvent.UserSendMassAnonymousNotifications}]`)
        }

        return { distributionId }
    }
}
