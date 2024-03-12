import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import { ActRecordRequestType } from '@src/generated'

import MyInfoService from '@services/myInfo'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/myInfo/hideActRecord'

export default class HideActRecordAction implements GrpcAppAction {
    constructor(private readonly myInfoService: MyInfoService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'hideActRecord'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        id: { type: 'string' },
        recordType: { type: 'string', enum: Object.values(ActRecordRequestType) },
        force: { type: 'boolean', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params,
            session: { user },
        } = args

        return await this.myInfoService.hideActRecord(user, params)
    }
}
