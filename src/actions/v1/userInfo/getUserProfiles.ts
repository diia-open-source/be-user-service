import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userInfo/getUserProfiles'

export default class GetUserProfilesAction implements GrpcAppAction {
    constructor(private readonly userProfileService: UserProfileService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getUserProfiles'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        userIdentifiers: { type: 'array', items: { type: 'string' } },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifiers },
        } = args

        const userProfiles = await this.userProfileService.getUserProfiles(userIdentifiers)

        return {
            userProfiles: userProfiles.map(({ identifier, gender, birthDay }) => ({ identifier, gender, birthDay })),
        }
    }
}
