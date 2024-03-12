import { DocumentType, ServiceActionArguments } from '@diia-inhouse/types'

import { EncryptedDataByDocumentType } from '@interfaces/services/userDocumentStorage'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        mobileUid?: string
        documentTypes?: DocumentType[]
    }
}

export type ActionResult = EncryptedDataByDocumentType
