import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserSigningHistoryService from '@services/userSigningHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userHistory/getUserSigningStatuses'

export default class GetUserSigningStatusesAction implements AppAction {
    constructor(private readonly userSigningHistoryService: UserSigningHistoryService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getUserSigningStatuses'

    readonly validationRules: ValidationSchema = {
        resourceIds: { type: 'array', items: { type: 'string' } },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { resourceIds } = args.params

        return await this.userSigningHistoryService.getItemStatuses(resourceIds)
    }
}
