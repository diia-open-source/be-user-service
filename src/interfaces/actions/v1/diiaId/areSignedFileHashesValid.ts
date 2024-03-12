import { UserActionArguments } from '@diia-inhouse/types'

import { SignAlgo } from '@interfaces/models/diiaId'
import { SignedFileHash } from '@interfaces/services/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        files: SignedFileHash[]
        signAlgo: SignAlgo
    }
}

export type ActionResult = boolean
