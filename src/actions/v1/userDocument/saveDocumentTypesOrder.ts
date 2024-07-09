import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentSettingsService from '@services/userDocumentSettings'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/saveDocumentTypesOrder'

export default class SaveDocumentTypesOrderAction implements AppAction {
    constructor(
        private readonly userDocumentSettingsService: UserDocumentSettingsService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            documentsOrder: {
                type: 'array',
                items: {
                    type: 'object',
                    props: {
                        documentType: { type: 'string', enum: this.documentTypes },
                        order: { type: 'number', min: 1 },
                    },
                },
            },
        }
    }

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'saveDocumentTypesOrder'

    readonly validationRules: ValidationSchema

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { documentsOrder },
            session: {
                user: { identifier },
            },
        } = args

        await this.userDocumentSettingsService.saveDocumentsOrder({ userIdentifier: identifier }, documentsOrder)

        return { success: true }
    }
}
