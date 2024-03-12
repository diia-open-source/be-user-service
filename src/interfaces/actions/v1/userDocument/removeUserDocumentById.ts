import { DocumentType, ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        documentType: DocumentType
        documentId: string
        mobileUid: string
    }
}

export type ActionResult = void
