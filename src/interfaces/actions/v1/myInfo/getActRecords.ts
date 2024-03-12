import { UserActionArguments } from '@diia-inhouse/types'

import { GetActRecordsReq, GetActRecordsRes } from '@src/generated'

export interface CustomActionArguments extends UserActionArguments {
    params: GetActRecordsReq
}

export type ActionResult = GetActRecordsRes
