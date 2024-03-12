import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/hasIdentifier'

export default class HasDiiaIdIdentifierAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'hasDiiaIdIdentifier'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        mobileUidToFilter: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, mobileUidToFilter },
        } = args

        return await this.diiaIdService.hasIdentifier(userIdentifier, mobileUidToFilter)
    }
}
