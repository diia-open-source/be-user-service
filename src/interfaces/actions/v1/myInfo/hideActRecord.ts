import { UserActionArguments } from '@diia-inhouse/types'

import { HideActRecordReq, HideActRecordRes } from '@src/generated'

export interface CustomActionArguments extends UserActionArguments {
    params: HideActRecordReq
}

export type ActionResult = HideActRecordRes
