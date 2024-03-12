import { DocumentType, UserActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        documentType: DocumentType
        documentId: string
    }
}

export interface ActionResult {
    success: boolean
}
