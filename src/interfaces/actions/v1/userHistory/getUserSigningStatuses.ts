import { ServiceActionArguments } from '@diia-inhouse/types'

import { UserHistoryItemStatusRecord } from '@interfaces/services/userHistory'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        resourceIds: string[]
    }
}

export type ActionResult = UserHistoryItemStatusRecord[]
