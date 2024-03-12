import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/removeFromStorageByHashData'

export default class RemoveFromStorageByHashDataAction implements AppAction {
    constructor(private readonly userDocumentStorageService: UserDocumentStorageService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'removeFromStorageByHashData'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        documentType: { type: 'string', enum: this.userDocumentStorageService.storageDocumentTypes },
        hashData: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { userIdentifier, documentType, hashData } = args.params

        await this.userDocumentStorageService.removeFromStorageByHashData(userIdentifier, documentType, hashData)
    }
}
