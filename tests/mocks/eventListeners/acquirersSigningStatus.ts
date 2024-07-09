import { v4 as uuid } from 'uuid'

import { mongo } from '@diia-inhouse/db'
import { AppUserActionHeaders, UserSession } from '@diia-inhouse/types'

import AcquirersSigningStatusEventListener from '@src/eventListeners/acquirersSigningStatus'

import { EventPayload } from '@interfaces/eventListeners/acquirersSigningStatus'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export default class AcquirersSigningStatusEventMock {
    constructor(private readonly acquirersSigningStatusEventListener: AcquirersSigningStatusEventListener) {}

    async handle(session: UserSession, headers: AppUserActionHeaders, status: UserHistoryItemStatus): Promise<EventPayload> {
        const {
            user: { identifier: userIdentifier },
        } = session
        const { mobileUid } = headers
        const payload: EventPayload = {
            userIdentifier,
            mobileUid,
            resourceId: uuid(),
            status,
            documents: [],
            acquirer: {
                id: new mongo.ObjectId(),
                name: 'Integration test acquirer',
                address: 'Integration test address',
            },
            offer: {
                hashId: uuid(),
                name: 'Integration test offer',
            },
        }

        await this.acquirersSigningStatusEventListener.handler(payload, { date: new Date() })

        return payload
    }
}
