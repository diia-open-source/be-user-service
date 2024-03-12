import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserHistoryService from '@services/userHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/userHistory/getHistoryByAction'
import { UserHistoryCode } from '@interfaces/services/userHistory'

export default class GetHistoryByActionAction implements AppAction {
    constructor(private readonly userHistoryService: UserHistoryService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'getHistoryByAction'

    readonly validationRules: ValidationSchema = {
        action: { type: 'string', enum: Object.values(UserHistoryCode) },
        skip: { type: 'number', convert: true, optional: true },
        limit: { type: 'number', convert: true, max: 20, optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { action, skip = 0, limit = 20 },
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        return await this.userHistoryService.getSigningHistoryByCodeV1(action, userIdentifier, skip, limit)
    }
}
