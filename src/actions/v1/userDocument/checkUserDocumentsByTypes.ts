import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/checkUserDocumentsByTypes'
import { VerifiedDocument } from '@interfaces/services/userDocument'

export default class CheckUserDocumentsByTypesAction implements AppAction {
    constructor(
        private readonly userDocumentService: UserDocumentService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            userIdentifier: { type: 'string' },
            documentsToVerify: {
                type: 'array',
                items: {
                    type: 'object',
                    props: {
                        documentType: { type: 'string', enum: this.documentTypes },
                        documentIdentifer: { type: 'string' },
                    },
                },
            },
        }
    }

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'checkUserDocumentsByTypes'

    readonly validationRules: ValidationSchema

    // Deprecated
    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { userIdentifier, documentsToVerify } = args.params

        const verifiedDocuments: VerifiedDocument[] = await this.userDocumentService.verifyUserDocuments(userIdentifier, documentsToVerify)

        return { verifiedDocuments }
    }
}
