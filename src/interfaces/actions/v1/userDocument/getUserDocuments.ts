import { ServiceActionArguments } from '@diia-inhouse/types'

import { UserDocument } from '@interfaces/models/userDocument'
import { GetUserDocumentsParams } from '@interfaces/services/userDocument'

export interface CustomActionArguments extends ServiceActionArguments {
    params: GetUserDocumentsParams
}

export interface ActionResult {
    documents: UserDocument[]
}
