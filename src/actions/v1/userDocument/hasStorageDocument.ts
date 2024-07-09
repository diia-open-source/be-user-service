import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/hasStorageDocument'

export default class HasStorageDocumentAction implements AppAction {
    constructor(
        private readonly userDocumentStorageService: UserDocumentStorageService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            userIdentifier: { type: 'string' },
            mobileUid: { type: 'string' },
            documentType: { type: 'string', enum: this.documentTypes },
            id: { type: 'string' },
        }
    }

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'hasStorageDocument'

    readonly validationRules: ValidationSchema

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, mobileUid, documentType, id },
        } = args

        return await this.userDocumentStorageService.hasStorageDocument(userIdentifier, mobileUid, documentType, id)
    }
}
