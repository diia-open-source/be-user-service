import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/hasStorageDocument'

export default class HasStorageDocumentAction implements AppAction {
    constructor(private readonly userDocumentStorageService: UserDocumentStorageService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'hasStorageDocument'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        mobileUid: { type: 'string' },
        documentType: { type: 'string', enum: Object.values(DocumentType) },
        id: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, mobileUid, documentType, id },
        } = args

        return await this.userDocumentStorageService.hasStorageDocument(userIdentifier, mobileUid, documentType, id)
    }
}
