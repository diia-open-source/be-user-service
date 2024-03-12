import { UserActionArguments } from '@diia-inhouse/types'

import { SigningHistoryItemResponseV1, UserHistoryCode } from '@interfaces/services/userHistory'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        itemId: string
        actionCode: UserHistoryCode
    }
}

export type ActionResult = SigningHistoryItemResponseV1
