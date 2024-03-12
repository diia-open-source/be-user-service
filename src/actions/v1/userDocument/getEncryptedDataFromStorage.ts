import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/getEncryptedDataFromStorage'

export default class GetEncryptedDataFromStorageAction implements AppAction {
    constructor(private readonly userDocumentStorageService: UserDocumentStorageService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getEncryptedDataFromStorage'

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
        const { userIdentifier, documentTypes, mobileUid } = args.params

        return await this.userDocumentStorageService.getEncryptedDataFromStorage(userIdentifier, mobileUid, documentTypes)
    }
}
