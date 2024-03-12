import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import SubscriptionService from '@services/subscription'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/subscription/removeSubscription'
import { SubscriptionCode } from '@interfaces/services/subscription'

export default class RemoveSubscriptionAction implements AppAction {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'removeSubscription'

    readonly validationRules: ValidationSchema = {
        code: { type: 'string', enum: Object.values(SubscriptionCode) },
    }

    getLockResource(args: CustomActionArguments): string {
        const {
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        return userIdentifier
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { code },
            session: {
                user: { identifier: userIdentifier, itn },
            },
        } = args

        await this.subscriptionService.unsubscribe({ itn, userIdentifier, code })

        return { success: true }
    }
}
