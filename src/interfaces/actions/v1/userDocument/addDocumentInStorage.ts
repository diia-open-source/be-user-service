import { DocumentType, ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        mobileUid?: string
        hashData: string
        documentType: DocumentType
        encryptedData: string
    }
}
