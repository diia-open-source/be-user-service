import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserHistoryService from '@services/userHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userHistory/getSessionHistoryScreen'

export default class GetSessionHistoryScreenAction implements AppAction {
    constructor(private readonly userHistoryService: UserHistoryService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getSessionHistoryScreen'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        sessionId: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { sessionId },
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        return await this.userHistoryService.getSessionHistoryScreen(userIdentifier, sessionId)
    }
}
