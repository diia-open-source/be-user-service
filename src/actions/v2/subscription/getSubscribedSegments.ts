import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import SubscriptionService from '@services/subscription'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/subscription/getSubscribedSegments'

export default class GetSubscribedSegmentsAction implements GrpcAppAction {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'getSubscribedSegments'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier },
        } = args

        const segments = await this.subscriptionService.getSubscribedSegments(userIdentifier)

        return { segments }
    }
}
