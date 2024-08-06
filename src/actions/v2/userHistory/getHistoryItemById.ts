import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserHistoryService from '@services/userHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/userHistory/getHistoryItemById'
import { UserHistoryCode } from '@interfaces/services/userHistory'

export default class GetHistoryItemByIdAction implements AppAction {
    constructor(private readonly userHistoryService: UserHistoryService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'getHistoryItemById'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        itemId: { type: 'string' },
        actionCode: { type: 'string', enum: Object.values(UserHistoryCode) },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { itemId, actionCode },
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        return await this.userHistoryService.getHistoryItemById(userIdentifier, itemId, actionCode)
    }
}
