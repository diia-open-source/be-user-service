import { DocumentType, UserActionArguments } from '@diia-inhouse/types'

import { DecryptedDocument } from '@interfaces/services/userDocumentStorage'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        userIdentifier: string
        documentType: DocumentType
    }
}

export type ActionResult = DecryptedDocument
