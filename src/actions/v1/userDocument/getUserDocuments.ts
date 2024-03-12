import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/getUserDocuments'
import { UserDocument } from '@interfaces/models/userDocument'

export default class GetUserDocumentsAction implements AppAction {
    constructor(private readonly userDocumentService: UserDocumentService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getUserDocuments'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        documentType: { type: 'string', enum: Object.values(DocumentType), optional: true },
        mobileUid: { type: 'string', optional: true },
        activeOnly: { type: 'boolean', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const documents: UserDocument[] = await this.userDocumentService.getUserDocuments(args.params)

        return { documents }
    }
}
