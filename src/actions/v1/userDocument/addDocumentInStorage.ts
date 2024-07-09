import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { CustomActionArguments } from '@interfaces/actions/v1/userDocument/addDocumentInStorage'

export default class AddDocumentInStorageAction implements AppAction {
    constructor(private readonly userDocumentStorageService: UserDocumentStorageService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'addDocumentInStorage'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        mobileUid: { type: 'string', optional: true },
        hashData: { type: 'string' },
        documentType: { type: 'string' },
        encryptedData: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<void> {
        const { userIdentifier, mobileUid, documentType, hashData, encryptedData } = args.params

        await this.userDocumentStorageService.addDocument(userIdentifier, hashData, documentType, encryptedData, undefined, undefined, {
            mobileUid,
        })
    }
}
