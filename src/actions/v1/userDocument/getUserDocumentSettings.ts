import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentSettingsService from '@services/userDocumentSettings'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/getUserDocumentSettings'

export default class GetUserDocumentSettingsAction implements GrpcAppAction {
    constructor(private readonly userDocumentSettingsService: UserDocumentSettingsService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getUserDocumentSettings'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { params } = args

        return await this.userDocumentSettingsService.getDocumentSettings(params)
    }
}
