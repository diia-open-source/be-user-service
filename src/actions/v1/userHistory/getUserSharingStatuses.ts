import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserSharingHistoryService from '@services/userSharingHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userHistory/getUserSharingStatuses'

export default class GetUserSharingStatusAction implements AppAction {
    constructor(private readonly userSharingHistoryService: UserSharingHistoryService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getUserSharingStatuses'

    readonly validationRules: ValidationSchema = {
        sharingIds: { type: 'array', items: { type: 'string' } },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { sharingIds } = args.params

        return await this.userSharingHistoryService.getItemStatuses(sharingIds)
    }
}
