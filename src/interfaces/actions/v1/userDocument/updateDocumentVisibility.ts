import { ServiceActionArguments } from '@diia-inhouse/types'

import { UpdateDocumentVisibilityReq } from '@src/generated'

export interface CustomActionArguments extends ServiceActionArguments {
    params: UpdateDocumentVisibilityReq
}

export type ActionResult = void
