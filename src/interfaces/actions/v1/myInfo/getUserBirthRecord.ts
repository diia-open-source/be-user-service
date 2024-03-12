import { UserActionArguments } from '@diia-inhouse/types'

import { GetUserBirthRecordReq, GetUserBirthRecordRes } from '@src/generated'

export interface CustomActionArguments extends UserActionArguments {
    params: GetUserBirthRecordReq
}

export type ActionResult = GetUserBirthRecordRes
