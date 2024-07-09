import { Document, mongo } from '@diia-inhouse/db'

import { SignAlgo } from '@interfaces/models/diiaId'
import { PublicServiceCode } from '@interfaces/models/subscription'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export type Action = 'authDiiaId' | string

export interface StatusHistoryItem {
    status: UserHistoryItemStatus
    date: Date
}

export interface SigningHistoryAcquirer {
    id: mongo.ObjectId
    name: string
    address: string
}

export interface SigningHistoryOffer {
    hashId: string
    name: string
}

export interface SigningHistoryRecipient {
    name: string
    address: string
}

export interface UserSigningHistoryItem {
    userIdentifier: string
    sessionId: string
    resourceId: string
    status: UserHistoryItemStatus
    statusHistory: StatusHistoryItem[]
    documents: string[]
    date: Date
    platformType?: string
    platformVersion?: string
    action?: Action
    acquirer?: SigningHistoryAcquirer
    offer?: SigningHistoryOffer
    recipient?: SigningHistoryRecipient
    publicService?: PublicServiceCode | string
    applicationId?: string
    signAlgo?: SignAlgo
    noSigningTime?: boolean
    noContentTimestamp?: boolean
}

export interface UserSigningHistoryItemModel extends UserSigningHistoryItem, Document {}
