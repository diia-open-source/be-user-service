import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/getDecryptedDataFromStorage'

export default class GetDecryptedDataFromStorageAction implements AppAction {
    constructor(private readonly userDocumentStorageService: UserDocumentStorageService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getDecryptedDataFromStorage'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        mobileUid: { type: 'string', optional: true },
        documentTypes: {
            type: 'array',
            items: { type: 'string', enum: this.userDocumentStorageService.storageDocumentTypes },
            optional: true,
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, documentTypes, mobileUid },
        } = args

        return await this.userDocumentStorageService.getDecryptedDataFromStorage(userIdentifier, { documentTypes, mobileUid })
    }
}
