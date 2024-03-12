import { DocumentType } from '@diia-inhouse/types'

import { SharingHistoryAcquirer, SharingHistoryOffer } from '@interfaces/models/userSharingHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export interface EventPayload {
    userIdentifier: string
    mobileUid: string
    sharingId: string
    status: UserHistoryItemStatus
    documents: DocumentType[]
    acquirer: SharingHistoryAcquirer
    offer?: SharingHistoryOffer
}
