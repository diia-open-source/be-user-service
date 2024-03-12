import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userInfo/saveUserCitizenship'
import { CitizenshipSource } from '@interfaces/models/userProfile'

export default class SaveUserCitizenshipAction implements AppAction {
    constructor(private readonly userProfileService: UserProfileService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'saveUserCitizenship'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        source: { type: 'string', enum: Object.values(CitizenshipSource) },
        sourceId: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, source, sourceId },
        } = args

        await this.userProfileService.updateUserCitizenship(userIdentifier, source, sourceId)

        return { success: true }
    }
}
