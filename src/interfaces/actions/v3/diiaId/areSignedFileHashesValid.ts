import { UserActionArguments } from '@diia-inhouse/types'

import { SignAlgo } from '@interfaces/models/diiaId'
import { AreSignedFileHashesValidResult, SignedFileHash } from '@interfaces/services/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        files: SignedFileHash[]
        returnOriginals?: boolean
        signAlgo: SignAlgo
    }
}

export type ActionResult = AreSignedFileHashesValidResult
