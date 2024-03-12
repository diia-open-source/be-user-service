import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import SubscriptionService from '@services/subscription'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/subscription/unsubscribe'
import { SubscriptionType } from '@interfaces/models/subscription'

export default class UnsubscribeAction implements AppAction {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'unsubscribe'

    readonly validationRules: ValidationSchema = {
        subscriptionType: { type: 'string', enum: Object.values(SubscriptionType) },
        documentType: { type: 'string', enum: Object.values(DocumentType) },
        documentSubscriptionId: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            session: {
                user: { identifier: userIdentifier },
            },
            params: { subscriptionType, documentType, documentSubscriptionId },
            headers,
        } = args

        await this.subscriptionService.setDocumentsSubscription({
            userIdentifier,
            subscriptionType,
            documentType,
            documentSubscriptionId,
            isSubscribed: false,
            headers,
        })

        return { success: true }
    }
}
