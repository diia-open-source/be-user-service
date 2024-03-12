import { DocumentType, ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        mobileUid?: string
        documentType: DocumentType
        hashData: string
    }
}

export type ActionResult = void
