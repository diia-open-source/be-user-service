import { UserActionArguments } from '@diia-inhouse/types'

import { FileToHash, HashedFile } from '@interfaces/externalEventListeners/diiaIdHashFiles'
import { SignAlgo } from '@interfaces/models/diiaId'
import { HashFilesToSignOptions } from '@interfaces/services/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        files: FileToHash[]
        signAlgo: SignAlgo
        options?: HashFilesToSignOptions
    }
}

export interface ActionResult {
    hashedFiles: HashedFile[]
}
