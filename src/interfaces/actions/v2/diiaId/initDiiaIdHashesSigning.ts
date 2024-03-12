import { UserActionArguments } from '@diia-inhouse/types'

import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { SignAlgo } from '@interfaces/models/diiaId'
import { PublicServiceCode } from '@interfaces/models/subscription'
import { SigningHistoryRecipient } from '@interfaces/models/userSigningHistoryItem'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        publicService: PublicServiceCode | string
        applicationId: string
        documents: string[]
        recipient: SigningHistoryRecipient
        signAlgo: SignAlgo
        signType: DiiaIdSignType
        noSigningTime?: boolean
        noContentTimestamp?: boolean
    }
}

export type ActionResult = void
