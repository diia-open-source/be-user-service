import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentSettingsService from '@services/userDocumentSettings'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/userDocument/saveDocumentTypesOrder'

export default class SaveDocumentTypesOrderAction implements AppAction {
    constructor(private readonly userDocumentSettingsService: UserDocumentSettingsService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'saveDocumentTypesOrder'

    readonly validationRules: ValidationSchema = {
        documentsOrder: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    documentType: { type: 'string', enum: Object.values(DocumentType) },
                    order: { type: 'number', min: 1 },
                },
            },
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { documentsOrder },
            session: {
                user: { identifier },
                features,
            },
        } = args

        await this.userDocumentSettingsService.saveDocumentsOrder({ userIdentifier: identifier, features }, documentsOrder)

        return { success: true }
    }
}
