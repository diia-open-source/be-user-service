import { Document } from '@diia-inhouse/db'
import { PlatformType, SessionType } from '@diia-inhouse/types'

export enum OnboardingButtonAction {
    Skip = 'skip',
}

export interface OnboardingBoard {
    title: string
    backgroundColor: string
    text?: string
    image?: string
    list?: {
        bullet: string
        items: { text: string }[]
    }
    footer: {
        backgroundColor: string
        button: {
            label: string
            action: OnboardingButtonAction
        }
    }
}

export interface OnboardingData {
    header: {
        logo: string
    }
    boards: OnboardingBoard[]
}

export interface Onboarding {
    appVersion: string
    platformType: PlatformType
    isVisible: boolean
    data: OnboardingData
    sessionType?: SessionType
}

export interface OnboardingModel extends Onboarding, Document {}
