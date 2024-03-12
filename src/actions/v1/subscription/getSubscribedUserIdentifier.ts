import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import SubscriptionService from '@services/subscription'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/subscription/getSubscribedUserIdentifier'
import { PublicServiceCode, SubscriptionType } from '@interfaces/models/subscription'

export default class GetSubscribedUserIdentifierAction implements AppAction {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getSubscribedUserIdentifier'

    readonly validationRules: ValidationSchema = {
        subscriptionType: { type: 'string', enum: Object.values(SubscriptionType) },
        publicServiceCode: { type: 'string', enum: Object.values(PublicServiceCode) },
        subscribedIdentifier: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { subscriptionType, publicServiceCode, subscribedIdentifier } = args.params

        return await this.subscriptionService.getSubscribedUserIdentifier(subscriptionType, publicServiceCode, subscribedIdentifier)
    }
}
