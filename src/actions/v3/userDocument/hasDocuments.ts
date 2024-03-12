import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, OwnerType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v3/userDocument/hasDocuments'

export default class HasDocumentsAction implements AppAction {
    constructor(private readonly userDocumentService: UserDocumentService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V3

    readonly name: string = 'hasDocuments'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        filters: {
            type: 'array',
            items: {
                type: 'array',
                items: {
                    type: 'object',
                    props: {
                        documentType: { type: 'string', enum: Object.values(DocumentType) },
                        ownerType: { type: 'string', enum: Object.values(OwnerType), optional: true },
                    },
                },
            },
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, filters },
        } = args

        const { hasDocuments } = await this.userDocumentService.hasDocumentsByFilters(userIdentifier, filters)

        return hasDocuments
    }
}
