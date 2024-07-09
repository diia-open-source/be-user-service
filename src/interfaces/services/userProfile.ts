import { mongo } from '@diia-inhouse/db'
import { Gender } from '@diia-inhouse/types'

import { AttentionMessage } from '@interfaces/services/index'
import { UserDocumentTypesCounts } from '@interfaces/services/userDocument'

export interface UserIdentifiersWithLastId {
    userIdentifiers: string[]
    nextLastId?: mongo.ObjectId
}

export interface UserInfoWithAttentionMessage {
    attentionMessage: AttentionMessage
    text: string
    phoneNumber?: string
    email?: string
}

export interface CabinetUserInfo {
    fName: string
    lName: string
    mName?: string
    itn: string
    edrpou?: string
    gender: Gender
    birthDay: string
    phoneNumber?: string
    email?: string
}

export interface UserFilter {
    gender?: Gender
    childrenAmount?: number
    age?: {
        from?: number
        to?: number
    }
    address?: {
        regionId: string
        atuId?: string
    }
    documents?: UserFilterDocument[]
    organizationId?: string
    userIdentifiersLink?: string
    itnsLink?: string
}

export interface UserIdentifier {
    identifier: string
}

export interface UserFilterDocument {
    type: string
}

export interface UserFilterCount {
    usersCount: number
}

export interface UserFilterCoverage {
    percent: number
}

export interface UserInfoForFilters {
    age: number
    gender: Gender
    documents: UserDocumentTypesCounts
    organizationId?: string
}
