import { IdentifierService } from '@diia-inhouse/crypto'
import { EventBusListener } from '@diia-inhouse/diia-queue'
import { ProfileFeature } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DocumentsService from '@services/documents'
import UserProfileService from '@services/userProfile'

import { EventPayload } from '@interfaces/externalEventListeners/officeIdentifierRemoved'
import { ExternalEvent } from '@interfaces/queue'

export default class OfficeIdentifierRemovedEventListener implements EventBusListener {
    constructor(
        private readonly userProfileService: UserProfileService,
        private readonly documentsService: DocumentsService,
        private readonly identifier: IdentifierService,
    ) {}

    readonly event: ExternalEvent = ExternalEvent.OfficeIdentifierRemoved

    readonly validationRules: ValidationSchema = {
        uuid: { type: 'uuid' },
        request: {
            type: 'object',
            optional: true,
            props: {
                rnokpp: { type: 'string' },
            },
        },
    }

    async handler(payload: EventPayload): Promise<void> {
        const {
            request: { rnokpp },
        } = payload

        const identifier = this.identifier.createIdentifier(rnokpp)

        await this.userProfileService.removeProfileFeature(identifier, ProfileFeature.office)
        await this.documentsService.expireDocument(identifier, 'official-certificate')
    }
}
