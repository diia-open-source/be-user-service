import { AppAction } from '@diia-inhouse/diia-app'

import { EventBus, InternalEvent } from '@diia-inhouse/diia-queue'
import { BadRequestError, InternalServerError } from '@diia-inhouse/errors'
import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import NotificationService from '@services/notification'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/startSendingSilentPushes'

export default class StartSendingSilentPushesAction implements AppAction {
    constructor(
        private readonly notificationService: NotificationService,

        private readonly eventBus: EventBus,
    ) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'startSendingSilentPushes'

    readonly validationRules: ValidationSchema = {
        actionType: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { actionType } = args.params

        const isExists: boolean = await this.notificationService.isSilentActionExists(actionType)
        if (!isExists) {
            throw new BadRequestError('There is no silent actions with provided actionType', { actionType })
        }

        const publishResult: boolean = await this.eventBus.publish(InternalEvent.UserSendMassSilentPushes, { actionType })
        if (!publishResult) {
            throw new InternalServerError('Failed to publish event')
        }

        return { success: true }
    }
}
