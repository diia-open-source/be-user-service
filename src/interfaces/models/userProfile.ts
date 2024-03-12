import { Document } from 'mongoose'

import { Gender, ProfileFeature } from '@diia-inhouse/types'

export enum CitizenshipSource {
    BankAccount = 'bankAccount',
}

export interface UserProfileCitizenship {
    country: 'Ukraine'
    date: Date
    sourceId?: string
}

export interface UserProfileFeatures {
    [ProfileFeature.office]?: DiiaOfficeProfile
}

export interface UserProfileSettings {
    myInfoUsePassportPhoto?: boolean
}

export interface UserProfile {
    identifier: string
    gender: Gender
    birthDay: Date
    citizenship?: Record<CitizenshipSource, UserProfileCitizenship>
    communityCode?: string
    features?: UserProfileFeatures
    settings?: UserProfileSettings
}

export interface DiiaOfficeProfile {
    profileId: string
    organizationId: string
    unitId: string
    scopes: string[]
    tokenError?: string
    tokenFailedAt?: Date
    isOrganizationAdmin: boolean
    status: DiiaOfficeStatus
    googleWorkspace?: string
}

export enum DiiaOfficeStatus {
    Active = 'ACTIVE',
    Suspended = 'SUSPENDED',
    Dismissed = 'DISMISSED',
}

export interface UserProfileModel extends UserProfile, Document {}
