import { EventBus, EventBusListener, MessagePayload } from '@diia-inhouse/diia-queue'
import { Logger } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import AnalyticsService from '@services/analytics'
import UserDocumentService from '@services/userDocument'

import { EventPayload, IdentifiedPenalty } from '@interfaces/eventListeners/publicServicePenaltyCreated'
import { InternalEvent } from '@interfaces/queue'
import { AnalyticsActionType, AnalyticsCategory, AnalyticsData } from '@interfaces/services/analytics'

export default class PublicServicePenaltyCreatedEventListener implements EventBusListener {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly userDocumentService: UserDocumentService,

        private readonly eventBus: EventBus,
        private readonly logger: Logger,
    ) {}

    readonly event: InternalEvent = InternalEvent.PublicServicePenaltyCreated

    readonly validationRules: ValidationSchema = {
        penaltyId: { type: 'string' },
        vehicleLicenseIdentifier: { type: 'string', optional: true },
        fixingDate: { type: 'date', convert: true },
    }

    async handler(message: EventPayload): Promise<void> {
        const { vehicleLicenseIdentifier, penaltyId, fixingDate: penaltyFixingDate } = message
        if (!vehicleLicenseIdentifier) {
            return
        }

        const userIdentifier: string | undefined = await this.userDocumentService.identifyPenaltyOwner(
            vehicleLicenseIdentifier,
            penaltyFixingDate,
        )
        if (!userIdentifier) {
            return
        }

        const identifiedPenalty: IdentifiedPenalty = { penaltyId, penaltyFixingDate, userIdentifier }

        this.logger.info('Identified penalty', identifiedPenalty)
        const analyticsData: AnalyticsData = { penaltyId }

        this.analyticsService.log(AnalyticsCategory.Penalties, userIdentifier, analyticsData, AnalyticsActionType.AddPenalty)

        await this.eventBus.publish(InternalEvent.UserPenaltyIdentified, <MessagePayload>(<unknown>identifiedPenalty))
    }
}
