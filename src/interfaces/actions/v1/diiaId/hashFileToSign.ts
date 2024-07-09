import { ServiceActionArguments } from '@diia-inhouse/types'

import { HashFileToSignRequest, HashFileToSignResponse } from '@src/generated'

export interface CustomActionArguments extends ServiceActionArguments {
    params: HashFileToSignRequest
}

export type ActionResult = HashFileToSignResponse
