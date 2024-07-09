import { IdentifierService } from '@diia-inhouse/crypto'
import { EventBusListener } from '@diia-inhouse/diia-queue'
import { DiiaOfficeStatus, Logger, ProfileFeature } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DocumentsService from '@services/documents'
import UserProfileService from '@services/userProfile'

import { EventPayload } from '@interfaces/externalEventListeners/officeIdentifier'
import { ExternalEvent } from '@interfaces/queue'

export default class OfficeIdentifierEventListener implements EventBusListener {
    constructor(
        private readonly userProfileService: UserProfileService,
        private readonly identifier: IdentifierService,
        private readonly logger: Logger,
        private readonly documentsService: DocumentsService,
    ) {}

    readonly event: ExternalEvent = ExternalEvent.OfficeIdentifier

    readonly validationRules: ValidationSchema = {
        uuid: { type: 'uuid' },
        response: {
            type: 'object',
            optional: true,
            props: {
                rnokpp: { type: 'string' },
                status: { type: 'string', enum: Object.values(DiiaOfficeStatus) },
                profile: {
                    type: 'object',
                    optional: true,
                    props: {
                        profileId: { type: 'string' },
                        unitId: { type: 'string' },
                        organizationId: { type: 'string' },
                        scopes: { type: 'array', items: { type: 'string' } },
                        isOrganizationAdmin: { type: 'boolean' },
                        googleWorkspace: { type: 'string', optional: true },
                    },
                },
            },
        },
        error: {
            type: 'object',
            optional: true,
            props: {
                message: { type: 'string' },
                http_code: { type: 'number' },
            },
        },
    }

    async handler(payload: EventPayload): Promise<void> {
        const { response, error } = payload
        if (error) {
            this.logger.fatal(`Received error response on ${this.event}`, { error })

            return
        }

        const { rnokpp, profile, status } = response
        const identifier = this.identifier.createIdentifier(rnokpp)

        await this.userProfileService.setProfileFeature(identifier, ProfileFeature.office, { ...profile, status })
        if (status !== DiiaOfficeStatus.ACTIVE) {
            await this.documentsService.expireDocument(identifier, 'official-certificate')
        }
    }
}
