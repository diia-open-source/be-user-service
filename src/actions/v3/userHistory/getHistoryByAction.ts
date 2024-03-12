import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserHistoryService from '@services/userHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v3/userHistory/getHistoryByAction'
import { UserHistoryCode } from '@interfaces/services/userHistory'

export default class GetHistoryByActionAction implements AppAction {
    constructor(private readonly userHistoryService: UserHistoryService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V3

    readonly name: string = 'getHistoryByAction'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        action: { type: 'string', enum: Object.values(UserHistoryCode) },
        session: { type: 'string', optional: true },
        skip: { type: 'number', convert: true, optional: true },
        limit: { type: 'number', convert: true, max: 20, optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { action, skip = 0, limit = 20, session },
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        return await this.userHistoryService.getSigningHistoryByCode(action, userIdentifier, skip, limit, session)
    }
}
