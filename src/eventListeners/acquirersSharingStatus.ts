import { IdentifierService } from '@diia-inhouse/crypto'
import { EventBusListener, InternalEvent, QueueMessageMetaData } from '@diia-inhouse/diia-queue'
import { DocumentType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserSharingHistoryService from '@services/userSharingHistory'

import { EventPayload } from '@interfaces/eventListeners/acquirersSharingStatus'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'
import { UpsertItemParams } from '@interfaces/services/userSharingHistory'

export default class AcquirersSharingStatusEventListener implements EventBusListener {
    constructor(
        private readonly userSharingHistoryService: UserSharingHistoryService,

        private readonly identifier: IdentifierService,
    ) {}

    readonly event: InternalEvent = InternalEvent.AcquirersSharingStatus

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        mobileUid: { type: 'string' },
        sharingId: { type: 'string' },
        status: { type: 'string', enum: Object.values(UserHistoryItemStatus) },
        documents: {
            type: 'array',
            items: {
                type: 'string',
                enum: Object.values(DocumentType),
            },
        },
        acquirer: {
            type: 'object',
            props: {
                id: { type: 'objectId' },
                name: { type: 'string' },
                address: { type: 'string' },
            },
        },
        offer: {
            type: 'object',
            optional: true,
            props: {
                hashId: { type: 'string' },
                name: { type: 'string' },
            },
        },
    }

    async handler(message: EventPayload, meta: QueueMessageMetaData): Promise<void> {
        const { userIdentifier, mobileUid, sharingId, status, documents, acquirer, offer } = message
        const { date } = meta

        const params: UpsertItemParams = {
            userIdentifier,
            sessionId: this.identifier.createIdentifier(mobileUid),
            sharingId,
            status,
            documents,
            date,
            acquirer,
        }
        if (offer) {
            params.offer = offer
        }

        await this.userSharingHistoryService.upsertItem(params)
    }
}
