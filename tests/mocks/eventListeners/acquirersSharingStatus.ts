import { ObjectId } from 'mongodb'
import { v4 as uuid } from 'uuid'

import { AppUserActionHeaders, UserSession } from '@diia-inhouse/types'

import AcquirersSharingStatusEventListener from '@src/eventListeners/acquirersSharingStatus'

import { EventPayload } from '@interfaces/eventListeners/acquirersSharingStatus'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export default class AcquirersSharingStatusEventMock {
    constructor(private readonly acquirersSharingStatusEventListener: AcquirersSharingStatusEventListener) {}

    async handle(session: UserSession, headers: AppUserActionHeaders, status: UserHistoryItemStatus): Promise<EventPayload> {
        const {
            user: { identifier: userIdentifier },
        } = session
        const { mobileUid } = headers
        const payload: EventPayload = {
            userIdentifier,
            mobileUid,
            sharingId: uuid(),
            status,
            documents: [],
            acquirer: {
                id: new ObjectId(),
                name: 'Integration test acquirer',
                address: 'Integration test address',
            },
        }

        await this.acquirersSharingStatusEventListener.handler(payload, { date: new Date() })

        return payload
    }
}
