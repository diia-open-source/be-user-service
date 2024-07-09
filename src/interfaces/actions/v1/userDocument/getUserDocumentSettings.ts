import { ServiceActionArguments } from '@diia-inhouse/types'

import { GetUserDocumentSettingsReq, GetUserDocumentSettingsRes } from '@src/generated'

export interface CustomActionArguments extends ServiceActionArguments {
    params: GetUserDocumentSettingsReq
}

export type ActionResult = GetUserDocumentSettingsRes
