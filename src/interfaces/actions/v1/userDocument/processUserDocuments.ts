import { DocumentType, ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        documentTypes: DocumentType[]
    }
}

export type ActionResult = [DocumentType, DocumentType][]
