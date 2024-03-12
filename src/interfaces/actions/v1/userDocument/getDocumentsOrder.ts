import { ServiceActionArguments } from '@diia-inhouse/types'

import { UserDocumentsOrderParams, UserDocumentsOrderResponse } from '@interfaces/services/userDocumentSettings'

export interface CustomActionArguments extends ServiceActionArguments {
    params: UserDocumentsOrderParams
}

export type ActionResult = UserDocumentsOrderResponse[]
