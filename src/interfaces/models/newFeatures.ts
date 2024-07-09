import { Document } from '@diia-inhouse/db'
import { PlatformType, SessionType } from '@diia-inhouse/types'

import { OnboardingBoard } from './onboarding'

export interface NewFeaturesData {
    header: {
        logo: string
        title?: string
        subTitle?: string
    }
    boards: OnboardingBoard[]
}

export interface NewFeatures {
    appVersion: string
    platformType: PlatformType
    isVisible: boolean
    data: NewFeaturesData
    viewsCount: number
    sessionType: SessionType
}

export interface NewFeaturesModel extends NewFeatures, Document {}
