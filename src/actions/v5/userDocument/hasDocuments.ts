import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, OwnerType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v5/userDocument/hasDocuments'

export default class HasDocumentsAction implements GrpcAppAction {
    constructor(private readonly userDocumentService: UserDocumentService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V5

    readonly name: string = 'hasDocuments'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        userIdentifier: { type: 'string' },
        filters: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    oneOf: {
                        type: 'array',
                        items: {
                            type: 'object',
                            props: {
                                documentType: { type: 'string', enum: Object.values(DocumentType) },
                                ownerType: { type: 'string', enum: Object.values(OwnerType), optional: true },
                                docStatus: { type: 'array', items: { type: 'number' }, optional: true },
                                docId: { type: 'string', optional: true },
                                documentIdentifier: { type: 'string', optional: true },
                            },
                        },
                    },
                },
            },
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { params } = args

        const { userIdentifier } = params

        const filters = params.filters.map(({ oneOf }) =>
            oneOf.map(({ documentType, ownerType, docStatus, docId, documentIdentifier }) => ({
                documentType: <DocumentType>documentType,
                ownerType,
                docStatus,
                docId,
                documentIdentifier,
            })),
        )

        return await this.userDocumentService.hasDocumentsByFilters(userIdentifier, filters)
    }
}
