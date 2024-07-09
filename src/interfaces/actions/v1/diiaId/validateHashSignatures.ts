import { UserActionArguments } from '@diia-inhouse/types'

import { ValidateHashSignaturesRequest, ValidateHashSignaturesResponse } from '@src/generated'

export interface CustomActionArguments extends UserActionArguments {
    params: ValidateHashSignaturesRequest
}

export type ActionResult = ValidateHashSignaturesResponse
