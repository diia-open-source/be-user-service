import { UpdateQuery } from 'mongoose'

import { DocumentType } from '@diia-inhouse/types'

import { PublicServiceCode, SubscriptionModel, SubscriptionType } from '@interfaces/models/subscription'
import { AnalyticsHeaders } from '@interfaces/services/analytics'

export enum SubscriptionCode {
    Debts = 'debts',
    CreditHistory = 'creditHistory',

    PublicService = 'public-service',
}

export enum SubscriptionStatus {
    Active = 'active',
    InActive = 'inactive',
    Blocked = 'blocked',
}

export interface SubscriptionResponse {
    name: string
    description: string
    code: PublicServiceCode
    status: SubscriptionStatus
}

export interface SubscriptionsResponse {
    description: string
    subscriptions: SubscriptionResponse[]
}

export interface SubscribeDocumentsParams {
    userIdentifier: string
    subscriptionType: SubscriptionType
    documentType: DocumentType
    documentSubscriptionId: string
    isSubscribed: boolean
    headers: AnalyticsHeaders
}

export interface SubscriptionParams {
    userIdentifier: string
    itn: string
    code: SubscriptionCode
    segmentId?: string
    autoSubscribe?: boolean
}

export interface SubscriptionStrategy {
    readonly subscriptionCode: SubscriptionCode
    subscribe(subscription: SubscriptionModel, params: SubscriptionParams): Promise<UpdateQuery<SubscriptionModel> | void | never>
    publishSubscription?(subscription: SubscriptionModel, params: SubscriptionParams): Promise<void>
    unsubscribe?(subscription: SubscriptionModel, params: SubscriptionParams): Promise<UpdateQuery<SubscriptionModel> | void | never>
}
