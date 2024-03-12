import moment from 'moment'

import { EventBusListener, InternalEvent } from '@diia-inhouse/diia-queue'
import { Gender, PlatformType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import EResidentProfileService from '@services/eResidentProfile'

import { EventPayload } from '@interfaces/eventListeners/authCreateOrUpdateEResidentProfile'

export default class AuthCreateOrUpdateEResidentProfileEventListener implements EventBusListener {
    constructor(private readonly eResidentProfileService: EResidentProfileService) {}

    readonly event: InternalEvent = InternalEvent.AuthCreateOrUpdateEResidentProfile

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        gender: { type: 'string', enum: Object.values(Gender) },
        birthDay: { type: 'string' },
        headers: {
            type: 'object',
            props: {
                mobileUid: { type: 'string' },
                platformType: { type: 'string', enum: Object.values(PlatformType) },
                platformVersion: { type: 'string' },
                appVersion: { type: 'string' },
            },
        },
    }

    async handler(message: EventPayload): Promise<void> {
        const { userIdentifier, gender, birthDay, headers } = message

        const dateOfBirth: Date = new Date(moment(birthDay, 'DD.MM.YYYY').valueOf())

        await Promise.all([
            // subscriptionService.setPublicServiceSubscriptions(userIdentifier, itn),
            this.eResidentProfileService.createOrUpdateProfile({ identifier: userIdentifier, gender, birthDay: dateOfBirth }, headers),
        ])
    }
}
