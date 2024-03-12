import { SignAlgo } from '@interfaces/models/diiaId'
import { Action, SigningHistoryAcquirer, SigningHistoryOffer } from '@interfaces/models/userSigningHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

// TODO(BACK-1845): make required when document-acquirers-service is deployed
export interface EventPayload {
    userIdentifier: string
    mobileUid: string
    platformType?: string
    platformVersion?: string
    action?: Action
    resourceId: string
    status: UserHistoryItemStatus
    documents: string[]
    acquirer: SigningHistoryAcquirer
    offer: SigningHistoryOffer
    signAlgo?: SignAlgo
}
