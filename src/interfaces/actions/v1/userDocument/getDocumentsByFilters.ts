import { ServiceActionArguments } from '@diia-inhouse/types'

import { UserDocument } from '@interfaces/models/userDocument'
import { DocumentFilter } from '@interfaces/services/userDocument'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        filters: DocumentFilter[]
    }
}

export interface ActionResult {
    documents: UserDocument[]
}
