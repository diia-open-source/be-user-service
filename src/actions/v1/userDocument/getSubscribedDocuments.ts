import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/getSubscribedDocuments'
import { SubscriptionType } from '@interfaces/models/subscription'

export default class GetSubscribedDocumentsAction implements AppAction {
    constructor(private readonly userDocumentService: UserDocumentService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getSubscribedDocuments'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        subscriptionType: { type: 'string', enum: Object.values(SubscriptionType) },
        documentType: { type: 'string', enum: Object.values(DocumentType) },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { userIdentifier, documentType } = args.params

        return { documents: await this.userDocumentService.getUserDocuments({ userIdentifier, documentType }) }
    }
}
