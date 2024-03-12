import { ObjectId } from 'bson'
import { Document } from 'mongoose'

import { DocumentType } from '@diia-inhouse/types'

import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export interface StatusHistoryItem {
    status: UserHistoryItemStatus
    date: Date
}

export interface SharingHistoryAcquirer {
    id: ObjectId
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
    documents: DocumentType[]
    date: Date
    acquirer: SharingHistoryAcquirer
    offer?: SharingHistoryOffer
}

export interface UserSharingHistoryItemModel extends UserSharingHistoryItem, Document {}
