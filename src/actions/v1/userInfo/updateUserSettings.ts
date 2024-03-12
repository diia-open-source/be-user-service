import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserSettingsService from '@services/userSettings'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userInfo/updateUserSettings'

export default class UpdateUserSettingsAction implements GrpcAppAction {
    constructor(private readonly userSettingsService: UserSettingsService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'updateUserSettings'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        myInfoUsePassportPhoto: { type: 'boolean', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params,
            session: { user },
        } = args

        await this.userSettingsService.updateUserSettings(user.identifier, params)
    }
}
