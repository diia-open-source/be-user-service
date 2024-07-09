import { SharingHistoryAcquirer, SharingHistoryOffer } from '@interfaces/models/userSharingHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export interface EventPayload {
    userIdentifier: string
    mobileUid: string
    sharingId: string
    status: UserHistoryItemStatus
    documents: string[]
    acquirer: SharingHistoryAcquirer
    offer?: SharingHistoryOffer
}
