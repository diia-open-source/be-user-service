import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/hasOneOfDocuments'

export default class HasOneOfDocumentsAction implements AppAction {
    constructor(private readonly userDocumentService: UserDocumentService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'hasOneOfDocuments'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        documentTypes: {
            type: 'array',
            items: { type: 'string', enum: Object.values(DocumentType) },
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { userIdentifier, documentTypes } = args.params

        return await this.userDocumentService.hasOneOfDocuments(userIdentifier, documentTypes)
    }
}
