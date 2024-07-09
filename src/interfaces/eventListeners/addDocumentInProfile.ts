import { PlatformType } from '@diia-inhouse/types'

import { UserProfileDocument } from '@interfaces/services/documents'

export interface EventPayload extends UserProfileDocument {
    userIdentifier: string
    documentType: string
    headers: {
        mobileUid: string
        platformType: PlatformType
        platformVersion: string
        appVersion: string
    }
}
