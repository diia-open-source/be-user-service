import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserHistoryService from '@services/userHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userHistory/getEResidentHistoryByAction'
import { HistoryAction } from '@interfaces/services/userHistory'

export default class GetEResidentHistoryByActionAction implements AppAction {
    constructor(private readonly userHistoryService: UserHistoryService) {}

    readonly sessionType: SessionType = SessionType.EResident

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getEResidentHistoryByAction'

    readonly validationRules: ValidationSchema = {
        action: { type: 'string', enum: Object.values(HistoryAction) },
        session: { type: 'string', optional: true },
        skip: { type: 'number', convert: true, optional: true },
        limit: { type: 'number', convert: true, max: 20, optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { action, session, skip = 0, limit = 20 },
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        return await this.userHistoryService.getHistoryByAction(action, userIdentifier, session, skip, limit)
    }
}
