import { randomUUID } from 'crypto'

import { mongo } from 'mongoose'

import { IdentifierService } from '@diia-inhouse/crypto'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import AcquirersSharingStatusEventListener from '@src/eventListeners/acquirersSharingStatus'

import UserSharingHistoryService from '@services/userSharingHistory'

import { EventPayload } from '@interfaces/eventListeners/acquirersSharingStatus'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe('AcquirersSharingStatusEventListener', () => {
    const testKit = new TestKit()
    const userSharingHistoryServiceMock = mockInstance(UserSharingHistoryService)
    const identifierServiceMock = mockInstance(IdentifierService)
    const acquirersSharingStatusEventListener = new AcquirersSharingStatusEventListener(
        userSharingHistoryServiceMock,
        identifierServiceMock,
    )

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const mobileUid = randomUUID()
            const sharingId = randomUUID()
            const sessionId = randomUUID()
            const message: EventPayload = {
                userIdentifier,
                mobileUid,
                sharingId,
                status: UserHistoryItemStatus.Done,
                documents: [],
                acquirer: {
                    id: new mongo.ObjectId(),
                    name: 'acquirer name',
                    address: 'acquirer address',
                },
                offer: {
                    hashId: '123',
                    name: 'offer name',
                },
            }
            const meta = {
                date: new Date(),
            }
            const { status, documents, acquirer, offer } = message
            const { date } = meta

            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(userSharingHistoryServiceMock, 'upsertItem').mockResolvedValueOnce()

            expect(await acquirersSharingStatusEventListener.handler(message, meta)).toBeUndefined()

            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(mobileUid)
            expect(userSharingHistoryServiceMock.upsertItem).toHaveBeenCalledWith({
                userIdentifier,
                sessionId,
                sharingId,
                status,
                documents,
                date,
                acquirer,
                offer,
            })
        })
    })
})
