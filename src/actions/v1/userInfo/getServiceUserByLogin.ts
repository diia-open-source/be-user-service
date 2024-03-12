import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import ServiceUserService from '@services/serviceUser'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userInfo/getServiceUserByLogin'

export default class GetServiceUserByLoginAction implements AppAction {
    constructor(private readonly serviceUserService: ServiceUserService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getServiceUserByLogin'

    readonly validationRules: ValidationSchema = {
        login: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { login: loginParam },
        } = args

        const { login, hashedPassword, twoFactorSecret } = await this.serviceUserService.getServiceUserByLogin(loginParam)

        return { login, hashedPassword, twoFactorSecret }
    }
}
