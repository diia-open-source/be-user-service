import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import MyInfoService from '@services/myInfo'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/myInfo/getUserBirthRecord'

export default class GetUserBirthRecordAction implements GrpcAppAction {
    constructor(private readonly myInfoService: MyInfoService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getUserBirthRecord'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        eTag: { type: 'string', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { eTag },
            session: { user },
        } = args

        return await this.myInfoService.getUserBirthRecord(user, eTag)
    }
}
