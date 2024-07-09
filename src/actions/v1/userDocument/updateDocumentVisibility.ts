import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentSettingsService from '@services/userDocumentSettings'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/updateDocumentVisibility'

export default class UpdateDocumentVisibilityAction implements GrpcAppAction {
    constructor(private readonly userDocumentSettingsService: UserDocumentSettingsService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'updateDocumentVisibility'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        userIdentifier: { type: 'string' },
        documentType: { type: 'string' },
        hideDocuments: { type: 'array', items: { type: 'string' } },
        unhideDocuments: { type: 'array', items: { type: 'string' } },
        hideDocumentType: { type: 'boolean', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { params } = args

        await this.userDocumentSettingsService.updateDocumentVisibility(params)
    }
}
