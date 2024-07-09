import { UserActionArguments } from '@diia-inhouse/types'

import { HashFilesToSignRequest, HashFilesToSignResponse } from '@src/generated'

export interface CustomActionArguments extends UserActionArguments {
    params: HashFilesToSignRequest
}

export type ActionResult = HashFilesToSignResponse
