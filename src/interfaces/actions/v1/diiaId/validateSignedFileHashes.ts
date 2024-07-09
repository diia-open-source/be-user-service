import { UserActionArguments } from '@diia-inhouse/types'

import { ValidateSignedFileHashesRequest } from '@src/generated'

export interface CustomActionArguments extends UserActionArguments {
    params: ValidateSignedFileHashesRequest
}

export type ActionResult = void
