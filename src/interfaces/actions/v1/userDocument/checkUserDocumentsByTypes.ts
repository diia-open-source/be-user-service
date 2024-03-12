import { ServiceActionArguments } from '@diia-inhouse/types'

import { DocumentToVerify, VerifiedDocument } from '@interfaces/services/userDocument'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        documentsToVerify: DocumentToVerify[]
    }
}

export interface ActionResult {
    verifiedDocuments: VerifiedDocument[]
}
