import { ServiceActionArguments } from '@diia-inhouse/types'

import { DecryptedDocuments } from '@interfaces/services/userDocumentStorage'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        mobileUid?: string
        documentTypes?: string[]
    }
}

export type ActionResult = DecryptedDocuments
