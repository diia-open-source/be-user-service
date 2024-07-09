import { Document } from '@diia-inhouse/db'

export interface UserOnboarding {
    mobileUid: string
    onboardingAppVersion: string
}

export interface UserOnboardingModel extends UserOnboarding, Document {}
