import { randomUUID } from 'crypto'

const uuidV4Stub = jest.fn()

jest.mock('uuid', () => ({ v4: uuidV4Stub }))

import { IdentifierService } from '@diia-inhouse/crypto'
import { AccessDeniedError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import InitDiiaIdHashesSigningAction from '@actions/v2/diiaId/initDiiaIdHashesSigning'

import DiiaIdService from '@services/diiaId'
import UserSigningHistoryService from '@services/userSigningHistory'

import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${InitDiiaIdHashesSigningAction.name}`, () => {
    const now = new Date()
    const testKit = new TestKit()
    const diiaIdService = mockInstance(DiiaIdService)
    const userSigningHistoryService = mockInstance(UserSigningHistoryService)
    const identifierService = mockInstance(IdentifierService)

    const action = new InitDiiaIdHashesSigningAction(diiaIdService, userSigningHistoryService, identifierService)

    const args = {
        params: {
            publicService: 'publicService',
            applicationId: 'applicationId',
            documents: ['doc1'],
            recipient: { name: 'name', address: 'address' },
            signAlgo: SignAlgo.DSTU,
            signType: DiiaIdSignType.EU_SIGN_TYPE_CADES_BES,
            noSigningTime: true,
            noContentTimestamp: true,
        },
        session: testKit.session.getUserSession(),
        headers: testKit.session.getHeaders(),
    }

    beforeEach(() => {
        jest.useFakeTimers({ now })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('Method `handler`', () => {
        it('should throw AccessDeniedError if failed to init hashes signing', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const sessionId = randomUUID()
            const err = new AccessDeniedError('failed to init hashes signing', {}, ProcessCode.RegistryUnavailableWhenSigning)

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(diiaIdService, 'initHashesSigning').mockRejectedValueOnce(err)
            jest.spyOn(userSigningHistoryService, 'upsertItem').mockResolvedValueOnce()

            await expect(action.handler(args)).rejects.toEqual(err)

            expect(userSigningHistoryService.upsertItem).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                sessionId,
                resourceId: requestUuid,
                status: UserHistoryItemStatus.Refuse,
                platformType: args.headers.platformType,
                platformVersion: args.headers.platformVersion,
                documents: args.params.documents,
                date: now,
                recipient: args.params.recipient,
                publicService: args.params.publicService,
                applicationId: args.params.applicationId,
                signAlgo: args.params.signAlgo,
                noSigningTime: args.params.noSigningTime,
                noContentTimestamp: args.params.noContentTimestamp,
            })
        })

        it('should throw Error if failed to init hashes signing', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const sessionId = randomUUID()
            const err = new Error('failed to init hashes signing')

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(diiaIdService, 'initHashesSigning').mockRejectedValueOnce(err)

            await expect(action.handler(args)).rejects.toEqual(err)

            expect(diiaIdService.initHashesSigning).toHaveBeenCalledWith(
                args.session.user.identifier,
                args.headers.mobileUid,
                args.params.signAlgo,
                args.params.signType,
                args.params.noSigningTime,
                args.params.noContentTimestamp,
            )
        })

        it('should successfully init hashes signing', async () => {
            const sessionId = randomUUID()

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(diiaIdService, 'initHashesSigning').mockResolvedValueOnce(true)

            jest.spyOn(userSigningHistoryService, 'upsertItem').mockResolvedValueOnce()

            await action.handler(args)

            expect(diiaIdService.initHashesSigning).toHaveBeenCalledWith(
                args.session.user.identifier,
                args.headers.mobileUid,
                args.params.signAlgo,
                args.params.signType,
                args.params.noSigningTime,
                args.params.noContentTimestamp,
            )
            expect(userSigningHistoryService.upsertItem).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                sessionId,
                resourceId: args.params.applicationId,
                status: UserHistoryItemStatus.Processing,
                platformType: args.headers.platformType,
                platformVersion: args.headers.platformVersion,
                documents: args.params.documents,
                date: now,
                recipient: args.params.recipient,
                publicService: args.params.publicService,
                applicationId: args.params.applicationId,
                signAlgo: args.params.signAlgo,
                noSigningTime: args.params.noSigningTime,
                noContentTimestamp: args.params.noContentTimestamp,
            })
        })
    })
})
