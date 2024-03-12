import { UserActionArguments } from '@diia-inhouse/types'

import { FileToHash, HashedFile } from '@interfaces/externalEventListeners/diiaIdHashFiles'
import { SignAlgo } from '@interfaces/models/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        files: FileToHash[]
        signAlgo: SignAlgo
    }
}

export interface ActionResult {
    hashedFiles: HashedFile[]
}
