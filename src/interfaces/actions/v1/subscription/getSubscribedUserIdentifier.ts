import { ServiceActionArguments } from '@diia-inhouse/types'

import { PublicServiceCode, SubscriptionType } from '@interfaces/models/subscription'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        subscriptionType: SubscriptionType
        publicServiceCode: PublicServiceCode
        subscribedIdentifier: string
    }
}

export type ActionResult = string | undefined
