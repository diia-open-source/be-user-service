import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentSettingsService from '@services/userDocumentSettings'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/userDocument/saveDocumentsOrderByDocumentType'

export default class SaveDocumentsOrderByDocumentTypeAction implements AppAction {
    constructor(
        private readonly userDocumentSettingsService: UserDocumentSettingsService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            documentType: { type: 'string', enum: this.documentTypes },
            documentsOrder: {
                type: 'array',
                items: {
                    type: 'object',
                    props: {
                        docNumber: { type: 'string' },
                        order: { type: 'number' },
                    },
                },
            },
        }
    }

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'saveDocumentsOrderByDocumentType'

    readonly validationRules: ValidationSchema

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { documentType, documentsOrder },
            session: {
                user: { identifier },
                features,
            },
        } = args

        await this.userDocumentSettingsService.saveDocumentsOrderByDocumentType(
            { userIdentifier: identifier, features },
            documentType,
            documentsOrder,
        )

        return { success: true }
    }
}
