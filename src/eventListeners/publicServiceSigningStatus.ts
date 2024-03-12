import { v4 as uuid } from 'uuid'

import { IdentifierService } from '@diia-inhouse/crypto'
import { EventBusListener, InternalEvent, QueueMessageMetaData } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserSigningHistoryService from '@services/userSigningHistory'

import { SigningStatusEventPayload } from '@interfaces/eventListeners/publicServiceSigningStatus'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'
import { UpsertItemParams } from '@interfaces/services/userSigningHistory'

export default class PublicServiceSigningStatusEventListener implements EventBusListener {
    constructor(
        private readonly userSigningHistoryService: UserSigningHistoryService,

        private readonly identifier: IdentifierService,
    ) {}

    readonly event: InternalEvent = InternalEvent.PublicServiceSigningStatus

    // TODO(BACK-1845): make required when public-service-service is deployed
    readonly validationRules: ValidationSchema<SigningStatusEventPayload> = {
        userIdentifier: { type: 'string' },
        mobileUid: { type: 'string' },
        platformType: { type: 'string', optional: true },
        platformVersion: { type: 'string', optional: true },
        resourceId: { type: 'string', optional: true },
        status: { type: 'string', enum: Object.values(UserHistoryItemStatus) },
        documents: {
            type: 'array',
            items: { type: 'string' },
        },
        recipient: {
            type: 'object',
            props: {
                name: { type: 'string' },
                address: { type: 'string' },
            },
        },
        publicService: { type: 'string', optional: true },
        applicationId: { type: 'string', optional: true },
    }

    async handler(message: SigningStatusEventPayload, meta: QueueMessageMetaData): Promise<void> {
        const {
            userIdentifier,
            mobileUid,
            platformType,
            platformVersion,
            resourceId = uuid(),
            status,
            documents,
            recipient,
            publicService,
            applicationId,
        } = message
        const { date } = meta

        const params: UpsertItemParams = {
            userIdentifier,
            sessionId: this.identifier.createIdentifier(mobileUid),
            platformType,
            platformVersion,
            resourceId,
            status,
            documents,
            date,
            recipient,
            publicService,
            applicationId,
        }

        await this.userSigningHistoryService.upsertItem(params)
    }
}
