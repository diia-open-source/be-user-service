import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserSigningHistoryService from '@services/userSigningHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userHistory/getHistoryItemById'
import { UserHistoryCode } from '@interfaces/services/userHistory'

export default class GetHistoryItemByIdAction implements AppAction {
    constructor(private readonly userSigningHistoryService: UserSigningHistoryService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getHistoryItemById'

    readonly validationRules: ValidationSchema = {
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

        return await this.userSigningHistoryService.getSigningHistoryItemByIdV1(itemId, userIdentifier, actionCode)
    }
}
