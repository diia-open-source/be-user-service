import { UserActionArguments } from '@diia-inhouse/types'

import { SignAlgo } from '@interfaces/models/diiaId'
import { PublicServiceCode } from '@interfaces/models/subscription'
import { SigningHistoryRecipient } from '@interfaces/models/userSigningHistoryItem'
import { FileIntegrityResult, SignedFileHash } from '@interfaces/services/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        files: SignedFileHash[]
        publicService: PublicServiceCode | string
        applicationId: string
        documents: string[]
        recipient: SigningHistoryRecipient
        returnOriginals?: boolean
        signAlgo: SignAlgo
    }
}

export interface ActionResult {
    checkResults: FileIntegrityResult[]
}
