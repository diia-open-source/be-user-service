import { randomUUID } from 'crypto'

const uuidV4Stub = jest.fn()

jest.mock('uuid', () => ({ v4: uuidV4Stub }))

import { IdentifierService } from '@diia-inhouse/crypto'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { AccessDeniedError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import ValidateSignedFileHashesAction from '@actions/v1/diiaId/verifyHash'

import UserSigningHistoryService from '@services/userSigningHistory'

import { cryptoDocServiceClient } from '@tests/mocks/grpc/clients'

import { ProcessCode } from '@interfaces/services'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${ValidateSignedFileHashesAction.name}`, () => {
    const now = new Date()
    const testKit = new TestKit()
    const loggerMock = mockInstance(DiiaLogger)
    const identifierService = new IdentifierService({ salt: 'salt' })
    const userSigningHistoryServiceMock = mockInstance(UserSigningHistoryService)

    const validateSignedFileHashesAction = new ValidateSignedFileHashesAction(
        userSigningHistoryServiceMock,
        identifierService,
        loggerMock,
        cryptoDocServiceClient,
    )

    beforeEach(() => {
        jest.useFakeTimers({ now })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('Method `handler`', () => {
        const args = {
            params: {
                files: [
                    {
                        name: 'name',
                        hash: 'hash',
                        signature: 'signature',
                    },
                ],
                publicService: 'publicService',
                applicationId: 'applicationId',
                documents: ['doc1', 'doc2'],
                recipient: {
                    name: 'name',
                    address: 'address',
                },
            },
            session: testKit.session.getUserSession(),
            headers: testKit.session.getHeaders(),
        }

        it('should throw error if failed to request external call', async () => {
            const msg = 'Failed to verify signature'
            const err = new AccessDeniedError(msg, {}, ProcessCode.SignedDocumentsIntegrityViolated)

            const sessionId = 'sessionId'

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(cryptoDocServiceClient, 'docVerifyHash').mockReturnValueOnce(Promise.reject(new Error('Mock Error')))

            await expect(async () => {
                await validateSignedFileHashesAction.handler(args)
            }).rejects.toEqual(err)

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(args.headers.mobileUid)
        })

        it('should throw error if failed upsert item', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const err = new AccessDeniedError('failed to compare files', {}, ProcessCode.SignedDocumentsIntegrityViolated)
            const sessionId = 'sessionId'

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(Promise, 'all').mockImplementation(() => Promise.resolve([]))

            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockRejectedValueOnce(err)

            await expect(async () => {
                await validateSignedFileHashesAction.handler(args)
            }).rejects.toEqual(err)

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(args.headers.mobileUid)
            expect(userSigningHistoryServiceMock.upsertItem).toHaveBeenCalledWith({
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
            })
        })

        it('should throw error if failed upsert item without process code', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const err = new AccessDeniedError('failed to compare files', {})
            const sessionId = 'sessionId'

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(Promise, 'all').mockImplementation(() => Promise.resolve([]))

            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockRejectedValueOnce(err)

            await expect(async () => {
                await validateSignedFileHashesAction.handler(args)
            }).rejects.toEqual(err)

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(args.headers.mobileUid)
            expect(userSigningHistoryServiceMock.upsertItem).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                sessionId,
                resourceId: args.params.applicationId,
                status: UserHistoryItemStatus.Done,
                platformType: args.headers.platformType,
                platformVersion: args.headers.platformVersion,
                documents: args.params.documents,
                date: now,
                recipient: args.params.recipient,
                publicService: args.params.publicService,
                applicationId: args.params.applicationId,
            })
        })

        it('should successfully execute validation signed files', async () => {
            const sessionId = 'sessionId'

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(Promise, 'all').mockImplementation(() => Promise.resolve([]))
            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockResolvedValueOnce()

            await validateSignedFileHashesAction.handler(args)

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(args.headers.mobileUid)
            expect(userSigningHistoryServiceMock.upsertItem).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                sessionId,
                resourceId: args.params.applicationId,
                status: UserHistoryItemStatus.Done,
                platformType: args.headers.platformType,
                platformVersion: args.headers.platformVersion,
                documents: args.params.documents,
                date: now,
                recipient: args.params.recipient,
                publicService: args.params.publicService,
                applicationId: args.params.applicationId,
            })
        })
    })
})
