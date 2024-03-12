import { UserActionArguments } from '@diia-inhouse/types'

import { AttentionMessage } from '@interfaces/services/index'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        skip?: number
        limit?: number
    }
}

export interface ActionResult {
    isAvailable: boolean
    text?: string
    attentionMessage?: AttentionMessage
    signingRequests: unknown[]
    total: number
}
