import { Document } from '@diia-inhouse/db'

export interface UserNewFeatures {
    mobileUid: string
    featuresAppVersion: string
    viewsCounter: number
}

export interface UserNewFeaturesModel extends UserNewFeatures, Document {}
