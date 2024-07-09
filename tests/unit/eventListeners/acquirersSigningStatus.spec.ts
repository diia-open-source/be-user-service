import { randomUUID } from 'node:crypto'

import { IdentifierService } from '@diia-inhouse/crypto'
import { mongo } from '@diia-inhouse/db'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { PlatformType } from '@diia-inhouse/types'

import AcquirersSigningStatusEventListener from '@src/eventListeners/acquirersSigningStatus'

import UserSigningHistoryService from '@services/userSigningHistory'

import { EventPayload } from '@interfaces/eventListeners/acquirersSigningStatus'
import { SignAlgo } from '@interfaces/models/diiaId'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe('AcquirersSigningStatusEventListener', () => {
    const testKit = new TestKit()
    const userSigningHistoryServiceMock = mockInstance(UserSigningHistoryService)
    const identifierServiceMock = mockInstance(IdentifierService)
    const acquirersSigningStatusEventListener = new AcquirersSigningStatusEventListener(
        userSigningHistoryServiceMock,
        identifierServiceMock,
    )

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const {
                user: { identifier },
            } = testKit.session.getUserSession()
            const sessionId = randomUUID()
            const message: EventPayload = {
                documents: [],
                mobileUid: randomUUID(),
                resourceId: randomUUID(),
                status: UserHistoryItemStatus.Done,
                userIdentifier: identifier,
                signAlgo: SignAlgo.DSTU,
                action: 'action',
                platformType: PlatformType.Android,
                platformVersion: '13',
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
            const meta = { date: new Date() }
            const { mobileUid, platformType, platformVersion, acquirer, action, resourceId, documents, status, offer, signAlgo } = message
            const { date } = meta

            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockResolvedValueOnce()

            expect(await acquirersSigningStatusEventListener.handler(message, meta)).toBeUndefined()

            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(mobileUid)
            expect(userSigningHistoryServiceMock.upsertItem).toHaveBeenCalledWith({
                userIdentifier: identifier,
                sessionId,
                platformType,
                platformVersion,
                action,
                resourceId,
                status,
                documents,
                date,
                acquirer,
                offer,
                signAlgo,
            })
        })
    })
})
