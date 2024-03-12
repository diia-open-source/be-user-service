import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import SubscriptionService from '@services/subscription'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/subscription/isSubscribed'
import { PublicServiceCode } from '@interfaces/models/subscription'

export default class IsSubscribedAction implements AppAction {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'isSubscribed'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        publicService: { type: 'string', enum: Object.values(PublicServiceCode) },
        subscriptionKey: { type: 'string', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, publicService, subscriptionKey },
        } = args

        return await this.subscriptionService.isSubscribed(userIdentifier, publicService, subscriptionKey)
    }
}
