import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'

import UserDocumentSettingsService from '@services/userDocumentSettings'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/userDocument/getDocumentsTypeOrder'

export default class GetDocumentsTypeOrderAction implements AppAction {
    constructor(private readonly userDocumentSettingsService: UserDocumentSettingsService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'getDocumentsTypeOrder'

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            user: { identifier: userIdentifier },
            features,
        } = args.session

        const documentsTypeOrder = await this.userDocumentSettingsService.getDocumentsTypeOrder({
            userIdentifier,
            features,
        })

        return { documentsTypeOrder }
    }
}
