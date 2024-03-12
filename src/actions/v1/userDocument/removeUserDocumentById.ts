import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import AnalyticsService from '@services/analytics'
import UserDocumentService from '@services/userDocument'
import UserDocumentStorageService from '@services/userDocumentStorage'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/removeUserDocumentById'

export default class RemoveUserDocumentByIdAction implements AppAction {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly userDocumentService: UserDocumentService,
        private readonly userDocumentStorageService: UserDocumentStorageService,
    ) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'removeUserDocumentById'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        userIdentifier: { type: 'string' },
        documentType: { type: 'string', enum: Object.values(DocumentType) },
        documentId: { type: 'string' },
        mobileUid: { type: 'string', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, documentType, documentId, mobileUid: paramsMobileUid },
            headers: { platformType, platformVersion, appVersion, mobileUid: headersMobileUid },
        } = args

        // TODO(BACK-0): use only paramsMobileUid after deploy of documents service
        const mobileUid = paramsMobileUid || headersMobileUid
        const headers = this.analyticsService.getHeaders(mobileUid, platformType, platformVersion, appVersion)

        await Promise.all([
            this.userDocumentService.removeUserDocumentById(userIdentifier, documentType, documentId, mobileUid, headers),
            this.userDocumentStorageService.removeFromStorageById(userIdentifier, documentType, documentId, mobileUid),
        ])
    }
}
