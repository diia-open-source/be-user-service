import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userInfo/hasUserProfile'

export default class HasUserProfileAction implements AppAction {
    constructor(private readonly userProfileService: UserProfileService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'hasUserProfile'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier },
        } = args

        return await this.userProfileService.hasUserProfile(userIdentifier)
    }
}
