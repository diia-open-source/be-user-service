import { UserActionArguments } from '@diia-inhouse/types'

import { FileToHash, HashedFile } from '@interfaces/externalEventListeners/diiaIdHashFiles'
import { SignAlgo } from '@interfaces/models/diiaId'
import { PublicServiceCode } from '@interfaces/models/subscription'
import { SigningHistoryRecipient } from '@interfaces/models/userSigningHistoryItem'
import { HashFilesToSignOptions } from '@interfaces/services/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        files: FileToHash[]
        publicService: PublicServiceCode | string
        applicationId: string
        documents: string[]
        recipient: SigningHistoryRecipient
        options?: HashFilesToSignOptions
        signAlgo: SignAlgo
    }
}

export interface ActionResult {
    hashedFiles: HashedFile[]
}
