import { Document } from '@diia-inhouse/db'
import { DiiaOfficeStatus, Gender, ProfileFeature } from '@diia-inhouse/types'

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

export interface UserProfile {
    identifier: string
    gender: Gender
    birthDay: Date
    citizenship?: Record<CitizenshipSource, UserProfileCitizenship>
    communityCode?: string
    features?: UserProfileFeatures
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

export interface UserProfileModel extends UserProfile, Document {}
