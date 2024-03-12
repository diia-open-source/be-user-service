import { ProfileFeature, ServiceActionArguments } from '@diia-inhouse/types'

import { UserProfileFeatures } from '@interfaces/models/userProfile'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        features: ProfileFeature[]
    }
}

export type ActionResult = UserProfileFeatures
