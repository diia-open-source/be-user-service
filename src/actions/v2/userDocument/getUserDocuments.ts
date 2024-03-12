import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, OwnerType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/userDocument/getUserDocuments'
import { DocumentFilter } from '@interfaces/services/userDocument'

export default class GetUserDocumentsAction implements GrpcAppAction {
    constructor(private readonly userDocumentService: UserDocumentService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'getUserDocuments'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        filters: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    documentType: { type: 'string', enum: Object.values(DocumentType) },
                    docStatus: { type: 'array', items: { type: 'number' }, optional: true },
                    ownerType: { type: 'string', enum: Object.values(OwnerType), optional: true },
                    docId: { type: 'string', optional: true },
                },
            },
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, filters },
        } = args

        const documents = await this.userDocumentService.getUserDocumentsByFilters(userIdentifier, <DocumentFilter[]>(<unknown>filters))

        return { documents }
    }
}
