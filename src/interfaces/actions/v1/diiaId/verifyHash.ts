import { UserActionArguments } from '@diia-inhouse/types'

import { PublicServiceCode } from '@interfaces/models/subscription'
import { SigningHistoryRecipient } from '@interfaces/models/userSigningHistoryItem'
import { SignedFileHash } from '@interfaces/services/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        files: SignedFileHash[]
        publicService: PublicServiceCode | string
        applicationId: string
        documents: string[]
        recipient: SigningHistoryRecipient
    }
}

export type ActionResult = void
