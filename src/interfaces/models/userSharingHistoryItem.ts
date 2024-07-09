import { Document, mongo } from '@diia-inhouse/db'

import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export interface StatusHistoryItem {
    status: UserHistoryItemStatus
    date: Date
}

export interface SharingHistoryAcquirer {
    id: mongo.ObjectId
    name: string
    address: string
}

export interface SharingHistoryOffer {
    hashId: string
    name: string
}

export interface UserSharingHistoryItem {
    userIdentifier: string
    sessionId: string
    sharingId: string
    status: UserHistoryItemStatus
    statusHistory: StatusHistoryItem[]
    documents: string[]
    date: Date
    acquirer: SharingHistoryAcquirer
    offer?: SharingHistoryOffer
}

export interface UserSharingHistoryItemModel extends UserSharingHistoryItem, Document {}
