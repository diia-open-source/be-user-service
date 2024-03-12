import { Document } from 'mongoose'

export interface UserNewFeatures {
    mobileUid: string
    featuresAppVersion: string
    viewsCounter: number
}

export interface UserNewFeaturesModel extends UserNewFeatures, Document {}
