import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, OwnerType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/getDocumentsByFilters'

export default class GetDocumentsByFilters implements AppAction {
    constructor(
        private readonly userDocumentService: UserDocumentService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            filters: {
                type: 'array',
                items: {
                    type: 'object',
                    props: {
                        documentType: { type: 'string', enum: this.documentTypes },
                        documentIdentifier: { type: 'string' },
                        docStatus: { type: 'array', items: { type: 'number' }, optional: true },
                        ownerType: { type: 'string', enum: Object.values(OwnerType), optional: true },
                        docId: { type: 'string', optional: true },
                    },
                },
            },
        }
    }

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getDocumentsByFilters'

    readonly validationRules: ValidationSchema

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { filters },
        } = args

        const documents = await this.userDocumentService.getDocumentsByFilters(filters)

        return { documents }
    }
}
