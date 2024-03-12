import { ServiceActionArguments } from '@diia-inhouse/types'

import { GetUserDocumentsRequest, GetUserDocumentsResponse } from '@src/generated'

export interface CustomActionArguments extends ServiceActionArguments {
    params: GetUserDocumentsRequest
}

export type ActionResult = GetUserDocumentsResponse
