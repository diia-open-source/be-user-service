import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { EventPayload } from '@interfaces/externalEventListeners/officeIdentifierTokenFail'

export default class OfficeIdentifierTokenFailEventListener implements EventBusListener {
    constructor(private readonly userProfileService: UserProfileService) {}

    readonly event: ExternalEvent = ExternalEvent.OfficeIdentifierTokenFail

    readonly validationRules: ValidationSchema = {
        uuid: { type: 'uuid' },
        request: {
            type: 'object',
            optional: true,
            props: {
                profileId: { type: 'string' },
                reason: { type: 'string' },
            },
        },
    }

    async handler(payload: EventPayload): Promise<void> {
        const {
            request: { profileId, reason },
        } = payload

        await this.userProfileService.officeTokenFailed(profileId, reason)
    }
}
