import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userInfo/loadUserProfileFeaturesAsync'

export default class LoadUserProfilesFeaturesAsyncAction implements AppAction {
    constructor(private readonly userProfileService: UserProfileService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'loadUserProfileFeaturesAsync'

    readonly validationRules: ValidationSchema = {
        itn: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { itn } = args.params

        return await this.userProfileService.checkForUserProfileFeatures(itn)
    }
}
