import { randomUUID } from 'crypto'

const uuidV4Stub = jest.fn()

jest.mock('uuid', () => ({ v4: uuidV4Stub }))

import { cloneDeep } from 'lodash'

import { IdentifierService } from '@diia-inhouse/crypto'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { AccessDeniedError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import ValidateSignedFileHashesAction from '@actions/v1/diiaId/validateSignedFileHashes'

import UserSigningHistoryService from '@services/userSigningHistory'

import { cryptoDocServiceClient } from '@mocks/grpc/clients'

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
        cryptoDocServiceClient,
        identifierService,
        loggerMock,
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
                        data: 'data',
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

            jest.spyOn(Promise, 'all').mockImplementation(() => Promise.reject('Mock Error'))

            await expect(async () => {
                await validateSignedFileHashesAction.handler(args)
            }).rejects.toEqual(err)

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(args.headers.mobileUid)
        })

        it('should throw error if failed upsert item', async () => {
            const requestUuid = randomUUID()

            const copyArgs = cloneDeep(args)

            copyArgs.params.files = []

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const err = new AccessDeniedError('failed to compare files', {}, ProcessCode.SignedDocumentsIntegrityViolated)
            const sessionId = 'sessionId'

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockRejectedValueOnce(err)

            await expect(async () => {
                await validateSignedFileHashesAction.handler(copyArgs)
            }).rejects.toEqual(err)

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(copyArgs.headers.mobileUid)
            expect(userSigningHistoryServiceMock.upsertItem).toHaveBeenCalledWith({
                userIdentifier: copyArgs.session.user.identifier,
                sessionId,
                resourceId: requestUuid,
                status: UserHistoryItemStatus.Refuse,
                platformType: copyArgs.headers.platformType,
                platformVersion: copyArgs.headers.platformVersion,
                documents: copyArgs.params.documents,
                date: now,
                recipient: copyArgs.params.recipient,
                publicService: copyArgs.params.publicService,
                applicationId: copyArgs.params.applicationId,
            })
        })

        it('should throw error if failed upsert item without process code', async () => {
            const requestUuid = randomUUID()

            const copyArgs = cloneDeep(args)

            copyArgs.params.files = []

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const err = new AccessDeniedError('failed to compare files', {})
            const sessionId = 'sessionId'

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockRejectedValueOnce(err)

            await expect(async () => {
                await validateSignedFileHashesAction.handler(copyArgs)
            }).rejects.toEqual(err)

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(copyArgs.headers.mobileUid)
            expect(userSigningHistoryServiceMock.upsertItem).toHaveBeenCalledWith({
                userIdentifier: copyArgs.session.user.identifier,
                sessionId,
                resourceId: copyArgs.params.applicationId,
                status: UserHistoryItemStatus.Done,
                platformType: copyArgs.headers.platformType,
                platformVersion: copyArgs.headers.platformVersion,
                documents: copyArgs.params.documents,
                date: now,
                recipient: copyArgs.params.recipient,
                publicService: copyArgs.params.publicService,
                applicationId: copyArgs.params.applicationId,
            })
        })

        it('should successfully execute validation signed files', async () => {
            const sessionId = 'sessionId'

            const copyArgs = cloneDeep(args)

            copyArgs.params.files = []

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockResolvedValueOnce()

            await validateSignedFileHashesAction.handler(copyArgs)

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(copyArgs.headers.mobileUid)
            expect(userSigningHistoryServiceMock.upsertItem).toHaveBeenCalledWith({
                userIdentifier: copyArgs.session.user.identifier,
                sessionId,
                resourceId: copyArgs.params.applicationId,
                status: UserHistoryItemStatus.Done,
                platformType: copyArgs.headers.platformType,
                platformVersion: copyArgs.headers.platformVersion,
                documents: copyArgs.params.documents,
                date: now,
                recipient: copyArgs.params.recipient,
                publicService: copyArgs.params.publicService,
                applicationId: copyArgs.params.applicationId,
            })
        })
    })
})
