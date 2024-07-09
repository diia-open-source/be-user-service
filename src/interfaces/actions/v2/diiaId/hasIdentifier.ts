import { ServiceActionArguments } from '@diia-inhouse/types'

import { HasDiiaIdIdentifierRequest, HasDiiaIdIdentifierResponse } from '@src/generated'

export interface CustomActionArguments extends ServiceActionArguments {
    params: HasDiiaIdIdentifierRequest
}

export type ActionResult = HasDiiaIdIdentifierResponse
