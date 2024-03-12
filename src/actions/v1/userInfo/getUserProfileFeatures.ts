import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, ProfileFeature, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userInfo/getUserProfileFeatures'

export default class GetUserProfileFeaturesAction implements AppAction {
    constructor(private readonly userProfileService: UserProfileService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getUserProfileFeatures'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        features: { type: 'array', items: { type: 'string', enum: Object.values(ProfileFeature) } },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { userIdentifier, features } = args.params

        return await this.userProfileService.getUserProfileFeatures(userIdentifier, features)
    }
}
