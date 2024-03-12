import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'

import SubscriptionService from '@services/subscription'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/subscription/getSubscriptions'

export default class GetSubscriptionsAction implements AppAction {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getSubscriptions'

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            headers,
            session: {
                user: { identifier: userIdentifier, itn },
            },
        } = args

        return await this.subscriptionService.getSubscriptions(userIdentifier, itn, headers)
    }
}
