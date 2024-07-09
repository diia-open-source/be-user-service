import { EventBusListener } from '@diia-inhouse/diia-queue'
import { PlatformType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import { userProfileDocumentValidationSchema } from '@src/validation'

import AnalyticsService from '@services/analytics'
import SubscriptionService from '@services/subscription'
import UserDocumentService from '@services/userDocument'

import { EventPayload } from '@interfaces/eventListeners/addDocumentsInProfile'
import { InternalEvent } from '@interfaces/queue'

export default class AddDocumentsInProfileEventListener implements EventBusListener {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly userDocumentService: UserDocumentService,
        private readonly subscriptionService: SubscriptionService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            userIdentifier: { type: 'string' },
            documentType: { type: 'string', enum: this.documentTypes },
            documents: {
                type: 'array',
                items: {
                    type: 'object',
                    props: userProfileDocumentValidationSchema,
                },
            },
            headers: {
                type: 'object',
                props: {
                    mobileUid: { type: 'string', optional: true },
                    platformType: { type: 'string', enum: Object.values(PlatformType), optional: true },
                    platformVersion: { type: 'string', optional: true },
                    appVersion: { type: 'string', optional: true },
                },
            },
            removeMissingDocuments: { type: 'boolean' },
        }
    }

    readonly event: InternalEvent = InternalEvent.DocumentsAddDocumentsInProfile

    readonly validationRules: ValidationSchema<EventPayload>

    async handler(message: EventPayload): Promise<void> {
        const {
            userIdentifier,
            documentType,
            documents,
            headers: { mobileUid, platformType, platformVersion, appVersion },
            removeMissingDocuments,
        } = message

        const headers = this.analyticsService.getHeaders(mobileUid, platformType, platformVersion, appVersion)

        await Promise.all([
            this.userDocumentService.updateDocuments(userIdentifier, documentType, documents, mobileUid, headers, removeMissingDocuments),
            this.subscriptionService.updateDocumentsSubscriptions(userIdentifier, documentType, documents, headers),
        ])
    }
}
