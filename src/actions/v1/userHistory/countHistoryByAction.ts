import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserHistoryService from '@services/userHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userHistory/countHistoryByAction'
import { HistoryAction } from '@interfaces/services/userHistory'

export default class CountHistoryByActionAction implements AppAction {
    constructor(private readonly userHistoryService: UserHistoryService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'countHistoryByAction'

    readonly validationRules: ValidationSchema = {
        action: { type: 'string', enum: Object.values(HistoryAction) },
        sessionId: { type: 'string', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { action, sessionId },
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        return {
            count: await this.userHistoryService.countHistoryByAction(action, userIdentifier, sessionId),
        }
    }
}
