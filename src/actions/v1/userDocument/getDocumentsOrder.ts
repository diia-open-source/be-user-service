import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentSettingsService from '@services/userDocumentSettings'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/getDocumentsOrder'

export default class GetDocumentsOrderAction implements AppAction {
    constructor(private readonly userDocumentSettingsService: UserDocumentSettingsService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getDocumentsOrder'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        features: { type: 'object', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        return await this.userDocumentSettingsService.getDocumentsOrder(args.params)
    }
}
