import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import { ActRecordRequestType } from '@src/generated'

import MyInfoService from '@services/myInfo'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/myInfo/getActRecords'

export default class GetActRecordsAction implements GrpcAppAction {
    constructor(private readonly myInfoService: MyInfoService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getActRecords'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        recordType: { type: 'string', enum: Object.values(ActRecordRequestType) },
        eTag: { type: 'string', optional: true },
        forceUpdate: { type: 'boolean', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { recordType, eTag, forceUpdate },
            session: { user },
        } = args

        return await this.myInfoService.getActRecords(user, recordType, eTag, forceUpdate)
    }
}
