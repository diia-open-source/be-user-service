import { Document } from 'mongoose'

export interface UserOnboarding {
    mobileUid: string
    onboardingAppVersion: string
}

export interface UserOnboardingModel extends UserOnboarding, Document {}
