import { EventBusListener, InternalEvent } from '@diia-inhouse/diia-queue'
import { Gender, Logger } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import AddressService from '@services/address'
import UserProfileService from '@services/userProfile'

import { EventPayload } from '@interfaces/eventListeners/documentsAdultRegistrationAddressCommunity'

export default class DocumentsAdultRegistrationAddressCommunityEventListener implements EventBusListener {
    constructor(
        private readonly addressService: AddressService,
        private readonly userProfileService: UserProfileService,

        private readonly logger: Logger,
    ) {}

    readonly event: InternalEvent = InternalEvent.DocumentsAdultRegistrationAddressCommunity

    readonly validationRules: ValidationSchema<EventPayload> = {
        userIdentifier: { type: 'string' },
        fName: { type: 'string' },
        lName: { type: 'string' },
        mName: { type: 'string' },
        birthDay: { type: 'string' },
        gender: { type: 'string', enum: Object.values(Gender) },
        koatuu: { type: 'string', optional: true },
        communityKodificatorCode: { type: 'string', optional: true },
    }

    async handler(message: EventPayload): Promise<void> {
        const { koatuu, communityKodificatorCode, userIdentifier } = message

        if (!koatuu && !communityKodificatorCode) {
            this.logger.info('No user community to update', { userIdentifier })

            return
        }

        const communityCode = communityKodificatorCode || (await this.addressService.findCommunityCodeByKoatuu(koatuu))
        if (!communityCode) {
            this.logger.info("Couldn't find community code by koatuu", { userIdentifier, koatuu })

            return
        }

        await this.userProfileService.updateUserCommunity(userIdentifier, communityCode)
    }
}
