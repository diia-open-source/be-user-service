import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserActionAccessService from '@services/userActionAccess'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/actionAccess/nullifyCounterActionAccess'
import { ActionAccessType } from '@interfaces/services/userActionAccess'

export default class NullifyCounterActionAccessAction implements AppAction {
    constructor(private readonly userActionAccessService: UserActionAccessService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'nullifyCounterActionAccess'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        actionAccessType: { type: 'string', enum: Object.values(ActionAccessType) },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { userIdentifier, actionAccessType } = args.params

        return await this.userActionAccessService.nullifyCounterActionAccess(userIdentifier, actionAccessType)
    }
}
