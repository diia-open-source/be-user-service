import { EventBusListener, InternalEvent } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'
import UserDeviceService from '@services/userDevice'
import UserDocumentService from '@services/userDocument'
import UserDocumentStorageService from '@services/userDocumentStorage'

import { EventPayload } from '@interfaces/eventListeners/authUserLogOut'

export default class AuthUserLogOutEventListener implements EventBusListener {
    constructor(
        private readonly diiaIdService: DiiaIdService,
        private readonly userDeviceService: UserDeviceService,
        private readonly userDocumentService: UserDocumentService,
        private readonly userDocumentStorageService: UserDocumentStorageService,
    ) {}

    readonly event: InternalEvent = InternalEvent.AuthUserLogOut

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        mobileUid: { type: 'string' },
    }

    async handler(message: EventPayload): Promise<void> {
        const { userIdentifier, mobileUid } = message

        await Promise.all([
            this.userDeviceService.unassignDevice(mobileUid, userIdentifier),
            this.diiaIdService.softDeleteIdentifiers(userIdentifier, { mobileUid }),
            this.userDocumentStorageService.removeCovidCertificatesFromStorage(userIdentifier, mobileUid),
            this.userDocumentService.removeDeviceDocuments(userIdentifier, mobileUid),
        ])
    }
}
