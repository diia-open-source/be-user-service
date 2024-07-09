import { UserActionArguments } from '@diia-inhouse/types'

import { SubscriptionType } from '@interfaces/models/subscription'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        subscriptionType: SubscriptionType
        documentType: string
        documentSubscriptionId: string
    }
}

export interface ActionResult {
    success: boolean
}
