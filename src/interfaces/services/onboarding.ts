import { NewFeaturesData } from '@interfaces/models/newFeatures'
import { OnboardingData } from '@interfaces/models/onboarding'

export interface OnboardingInfo {
    features?: NewFeaturesData | OnboardingData
}
