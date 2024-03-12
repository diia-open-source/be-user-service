import { UserActionArguments } from '@diia-inhouse/types'

import { GetFamilyReq, GetFamilyRes } from '@src/generated'

export interface CustomActionArguments extends UserActionArguments {
    params: GetFamilyReq
}

export type ActionResult = GetFamilyRes
