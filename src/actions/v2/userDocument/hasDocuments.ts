import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/userDocument/hasDocuments'

export default class HasDocumentsAction implements AppAction {
    constructor(
        private readonly userDocumentService: UserDocumentService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            userIdentifier: { type: 'string' },
            documentTypes: {
                type: 'array',
                items: {
                    type: 'array',
                    items: { type: 'string', enum: this.documentTypes },
                },
            },
        }
    }

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'hasDocuments'

    readonly validationRules: ValidationSchema

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, documentTypes },
        } = args

        return await this.userDocumentService.hasDocuments(userIdentifier, documentTypes)
    }
}
