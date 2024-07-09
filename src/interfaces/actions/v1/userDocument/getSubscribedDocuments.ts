import { ServiceActionArguments } from '@diia-inhouse/types'

import { SubscriptionType } from '@interfaces/models/subscription'
import { UserDocument } from '@interfaces/models/userDocument'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        subscriptionType: SubscriptionType
        documentType: string
    }
}

export interface ActionResult {
    documents: UserDocument[]
}
