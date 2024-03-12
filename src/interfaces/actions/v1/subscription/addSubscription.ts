import { UserActionArguments } from '@diia-inhouse/types'

import { ProcessCode } from '@interfaces/services'
import { SubscriptionCode } from '@interfaces/services/subscription'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        code: SubscriptionCode
        segmentId?: string
    }
}

export interface ActionResult {
    success?: boolean
    processCode?: ProcessCode
}
