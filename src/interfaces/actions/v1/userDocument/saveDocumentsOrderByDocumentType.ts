import { UserActionArguments } from '@diia-inhouse/types'

import { SaveDocumentsOrderByDocumentTypeRequest } from '@interfaces/services/userDocumentSettings'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        documentType: string
        documentsOrder: SaveDocumentsOrderByDocumentTypeRequest[]
    }
}

export interface ActionResult {
    success: boolean
}
