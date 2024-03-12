import { PublicServiceCode } from '@interfaces/models/subscription'
import { SigningHistoryRecipient } from '@interfaces/models/userSigningHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

// TODO(BACK-1845): make required when public-service-service is deployed
export interface SigningStatusEventPayload {
    userIdentifier: string
    mobileUid: string
    platformType?: string
    platformVersion?: string
    resourceId?: string
    status: UserHistoryItemStatus
    documents: string[]
    recipient: SigningHistoryRecipient
    publicService?: PublicServiceCode | string
    applicationId?: string
}
