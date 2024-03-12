import { AnalyticsActionResult, RatingCategory, RatingFormCode, RatingServiceCode, RatingType } from '@diia-inhouse/analytics'
import { DocumentType, OwnerType, PlatformType } from '@diia-inhouse/types'

import { SubscriptionType } from '@interfaces/models/subscription'

export enum AnalyticsCategory {
    Users = 'users',
    Penalties = 'penalties',
    CloneCheck = 'cloneCheck',
}

export enum AnalyticsActionType {
    AddDocument = 'addDocument',
    RemoveDocument = 'removeDocument',
    AddDocumentSubscription = 'addDocumentSubscription',
    RemoveDocumentSubscription = 'removeDocumentSubscription',
    AddPenalty = 'addPenalty',
}

export interface AnalyticsData {
    documentId?: string
    documentType?: DocumentType
    subscriptionType?: SubscriptionType
    ownerType?: OwnerType
    penaltyId?: string
}

export interface AnalyticsLog {
    analytics: {
        date: string
        category: AnalyticsCategory
        action: {
            type: AnalyticsActionType
            result: AnalyticsActionResult
        }
        identifier?: string
        appVersion?: string
        device?: {
            identifier: string
            platform: {
                type: PlatformType
                version: string
            }
        }
        data?: AnalyticsData
    }
}

export interface GetLastSubmittedRatingParams {
    userIdentifier: string
    category: RatingCategory
    serviceCode: RatingServiceCode
    formCode?: RatingFormCode
    ratingType?: RatingType
    resourceId?: string
}

export interface SubmittedRating {
    userIdentifier: string
    mobileUid: string
    resourceId?: string
    isClosed: boolean
    rating?: string
    selectedChips?: string[]
    comment?: string
    completingTimeMs?: number
    ratedAt: string
    category: RatingCategory
    serviceCode: RatingServiceCode
    ratingType?: RatingType
}

export interface AnalyticsHeaders {
    mobileUid: string
    platformType: PlatformType
    platformVersion: string
    appVersion: string
}
