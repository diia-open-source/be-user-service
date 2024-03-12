import { randomUUID } from 'crypto'

const uuidV4Stub = jest.fn()

jest.mock('uuid', () => ({ v4: uuidV4Stub }))

import { IdentifierService } from '@diia-inhouse/crypto'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { PlatformType } from '@diia-inhouse/types'

import PublicServiceSigningStatusEventListener from '@src/eventListeners/publicServiceSigningStatus'

import UserSigningHistoryService from '@services/userSigningHistory'

import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe('PublicServiceSigningStatusEventListener', () => {
    const testKit = new TestKit()
    const userSigningHistoryServiceMock = mockInstance(UserSigningHistoryService)
    const identifierServiceMock = mockInstance(IdentifierService)
    const publicServiceSigningStatusEventListener = new PublicServiceSigningStatusEventListener(
        userSigningHistoryServiceMock,
        identifierServiceMock,
    )

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const date = new Date()
            const resourceId = randomUUID()
            const mobileUid = randomUUID()
            const applicationId = randomUUID()
            const sessionId = randomUUID()
            const message = {
                documents: [],
                mobileUid,
                recipient: {
                    address: 'address',
                    name: 'name',
                },
                status: UserHistoryItemStatus.Done,
                userIdentifier,
                applicationId,
                platformType: PlatformType.Android,
                platformVersion: '13',
                publicService: 'public-service',
            }
            const meta = { date }
            const { platformType, platformVersion, status, documents, recipient, publicService } = message

            uuidV4Stub.mockReturnValueOnce(resourceId)
            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockResolvedValueOnce()

            expect(await publicServiceSigningStatusEventListener.handler(message, meta)).toBeUndefined()

            expect(uuidV4Stub).toHaveBeenCalledWith()
            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(mobileUid)
            expect(userSigningHistoryServiceMock.upsertItem).toHaveBeenCalledWith({
                userIdentifier,
                sessionId,
                platformType,
                platformVersion,
                resourceId,
                status,
                documents,
                date,
                recipient,
                publicService,
                applicationId,
            })
        })
    })
})
