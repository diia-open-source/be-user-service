import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, OwnerType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v3/userDocument/hasDocuments'

export default class HasDocumentsAction implements AppAction {
    constructor(
        private readonly userDocumentService: UserDocumentService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            userIdentifier: { type: 'string' },
            filters: {
                type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        props: {
                            documentType: { type: 'string', enum: this.documentTypes },
                            ownerType: { type: 'string', enum: Object.values(OwnerType), optional: true },
                        },
                    },
                },
            },
        }
    }

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V3

    readonly name: string = 'hasDocuments'

    readonly validationRules: ValidationSchema

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, filters },
        } = args

        const { hasDocuments } = await this.userDocumentService.hasDocumentsByFilters(userIdentifier, filters)

        return hasDocuments
    }
}
