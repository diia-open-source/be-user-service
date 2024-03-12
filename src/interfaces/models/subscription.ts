import { Document } from 'mongoose'

import { DocumentType } from '@diia-inhouse/types'

export enum SubscriptionType {
    Push = 'push',
    Segment = 'segment',
}

export enum SubscriptionSubType {
    Documents = 'documents',
    PublicServices = 'publicServices',
}

export enum PublicServiceCode {
    Debts = 'debts',

    CreditHistory = 'creditHistory',
}

export type SubscriptionItems = Record<string, boolean>

export type DocumentsSubs = Partial<Record<DocumentType, SubscriptionItems>>

export type PublicServicesSubs = Record<PublicServiceCode, SubscriptionItems>

export interface PushSubscriptionBySubType {
    [SubscriptionSubType.Documents]: DocumentsSubs
    [SubscriptionSubType.PublicServices]: PublicServicesSubs
}

export interface SegmentSubscriptionBySubType {
    [SubscriptionSubType.PublicServices]: string[]
}

export enum SubscriptionSource {
    Ubch = 'ubch',
}

export type SubscriptionIds = Partial<Record<SubscriptionSource, string>>

export interface Subscription {
    userIdentifier: string
    subscriptionIds: SubscriptionIds
    [SubscriptionType.Push]: PushSubscriptionBySubType
    [SubscriptionType.Segment]?: SegmentSubscriptionBySubType
}

export interface SubscriptionModel extends Subscription, Document {}
