import { EventBusListener } from '@diia-inhouse/diia-queue'
import { PlatformType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import { userProfileDocumentValidationSchema } from '@src/validation'

import AnalyticsService from '@services/analytics'
import UserDocumentService from '@services/userDocument'

import { EventPayload } from '@interfaces/eventListeners/addDocumentInProfile'
import { InternalEvent } from '@interfaces/queue'

export default class AddDocumentInProfileEventListener implements EventBusListener {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly userDocumentService: UserDocumentService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            userIdentifier: { type: 'string' },
            documentType: { type: 'string', enum: this.documentTypes },
            headers: {
                type: 'object',
                props: {
                    mobileUid: { type: 'string' },
                    platformType: { type: 'string', enum: Object.values(PlatformType) },
                    platformVersion: { type: 'string' },
                    appVersion: { type: 'string' },
                },
            },
            ...userProfileDocumentValidationSchema,
        }
    }

    readonly event: InternalEvent = InternalEvent.DocumentsAddDocumentInProfile

    readonly validationRules: ValidationSchema<EventPayload>

    async handler(message: EventPayload): Promise<void> {
        const {
            userIdentifier,
            documentType,
            headers: { mobileUid, platformType, platformVersion, appVersion },
            ...document
        } = message

        const headers = this.analyticsService.getHeaders(mobileUid, platformType, platformVersion, appVersion)

        await this.userDocumentService.addDocument(userIdentifier, documentType, document, mobileUid, headers)
    }
}
