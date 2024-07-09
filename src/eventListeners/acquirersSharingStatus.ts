import { IdentifierService } from '@diia-inhouse/crypto'
import { mongo } from '@diia-inhouse/db'
import { EventBusListener, QueueMessageMetaData } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserSharingHistoryService from '@services/userSharingHistory'

import { EventPayload } from '@interfaces/eventListeners/acquirersSharingStatus'
import { InternalEvent } from '@interfaces/queue'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'
import { UpsertItemParams } from '@interfaces/services/userSharingHistory'

export default class AcquirersSharingStatusEventListener implements EventBusListener {
    constructor(
        private readonly userSharingHistoryService: UserSharingHistoryService,
        private readonly documentTypes: string[],

        private readonly identifier: IdentifierService,
    ) {
        this.validationRules = {
            userIdentifier: { type: 'string' },
            mobileUid: { type: 'string' },
            sharingId: { type: 'string' },
            status: { type: 'string', enum: Object.values(UserHistoryItemStatus) },
            documents: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: this.documentTypes,
                },
            },
            acquirer: {
                type: 'object',
                props: {
                    id: { type: 'string' },
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
    }

    readonly event: InternalEvent = InternalEvent.AcquirersSharingStatus

    readonly validationRules: ValidationSchema

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
            acquirer: { ...acquirer, id: new mongo.ObjectId(acquirer.id) },
        }
        if (offer) {
            params.offer = offer
        }

        await this.userSharingHistoryService.upsertItem(params)
    }
}
