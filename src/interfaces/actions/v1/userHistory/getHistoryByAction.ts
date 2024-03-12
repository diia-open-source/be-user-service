import { UserActionArguments } from '@diia-inhouse/types'

import { HistoryAction, HistoryResponse } from '@interfaces/services/userHistory'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        action: HistoryAction
        session?: string
        skip?: number
        limit?: number
    }
}

export type ActionResult = HistoryResponse
