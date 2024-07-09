import { randomUUID } from 'node:crypto'

const uuidV4Stub = jest.fn()

jest.mock('uuid', () => ({ v4: uuidV4Stub }))

import { IdentifierService } from '@diia-inhouse/crypto'
import { AccessDeniedError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import ValidateHashSignaturesAction from '@actions/v1/diiaId/validateHashSignatures'

import DiiaIdService from '@services/diiaId'
import UserSigningHistoryService from '@services/userSigningHistory'

import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'
import { FileIntegrityResult } from '@interfaces/services/diiaId'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${ValidateHashSignaturesAction.name}`, () => {
    const now = new Date()
    const testKit = new TestKit()
    const identifierService = new IdentifierService({ salt: 'salt' })
    const userSigningHistoryServiceMock = mockInstance(UserSigningHistoryService)

    const diiaIdServiceMock = mockInstance(DiiaIdService)

    const validateHashSignaturesAction = new ValidateHashSignaturesAction(
        diiaIdServiceMock,
        userSigningHistoryServiceMock,
        identifierService,
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
                files: [],
                publicService: 'publicService',
                applicationId: 'applicationId',
                documents: ['doc1', 'doc2'],
                recipient: {
                    name: 'name',
                    address: 'address',
                },
                returnOriginals: true,
                signAlgo: SignAlgo.DSTU,
            },
            session: testKit.session.getUserSession(),
            headers: testKit.session.getHeaders(),
        }

        it('should throw error if signed files are not valid', async () => {
            const err = new AccessDeniedError('Documents integrity violated', {}, ProcessCode.SignedDocumentsIntegrityViolated)

            const sessionId = 'sessionId'

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(diiaIdServiceMock, 'areSignedFileHashesValid').mockResolvedValueOnce({ areValid: false, checkResults: [] })

            await expect(async () => {
                await validateHashSignaturesAction.handler(args)
            }).rejects.toEqual(err)

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(args.headers.mobileUid)
            expect(diiaIdServiceMock.areSignedFileHashesValid).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                mobileUid: args.headers.mobileUid,
                files: args.params.files,
                returnOriginals: args.params.returnOriginals,
                signAlgo: args.params.signAlgo,
            })
        })

        it('should throw error if failed request', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const err = new AccessDeniedError('failed to compare files', {}, ProcessCode.SignedDocumentsIntegrityViolated)
            const sessionId = 'sessionId'

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(diiaIdServiceMock, 'areSignedFileHashesValid').mockRejectedValueOnce(err)
            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockResolvedValueOnce()

            await expect(async () => {
                await validateHashSignaturesAction.handler(args)
            }).rejects.toEqual(err)
            expect(identifierService.createIdentifier).toHaveBeenCalledWith(args.headers.mobileUid)
            expect(diiaIdServiceMock.areSignedFileHashesValid).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                mobileUid: args.headers.mobileUid,
                files: args.params.files,
                returnOriginals: args.params.returnOriginals,
                signAlgo: args.params.signAlgo,
            })
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

        it('should throw error if failed request without process code', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const err = new AccessDeniedError('failed to compare files', {})
            const sessionId = 'sessionId'

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(diiaIdServiceMock, 'areSignedFileHashesValid').mockRejectedValueOnce(err)

            await expect(async () => {
                await validateHashSignaturesAction.handler(args)
            }).rejects.toEqual(err)
            expect(identifierService.createIdentifier).toHaveBeenCalledWith(args.headers.mobileUid)
            expect(diiaIdServiceMock.areSignedFileHashesValid).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                mobileUid: args.headers.mobileUid,
                files: args.params.files,
                returnOriginals: args.params.returnOriginals,
                signAlgo: args.params.signAlgo,
            })
        })

        it('should return check result', async () => {
            const sessionId = 'sessionId'
            const checkResults: FileIntegrityResult[] = []

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)
            jest.spyOn(diiaIdServiceMock, 'areSignedFileHashesValid').mockResolvedValueOnce({ areValid: true, checkResults })
            jest.spyOn(userSigningHistoryServiceMock, 'upsertItem').mockResolvedValueOnce()

            expect(await validateHashSignaturesAction.handler(args)).toMatchObject({ checkResults })

            expect(identifierService.createIdentifier).toHaveBeenCalledWith(args.headers.mobileUid)
            expect(diiaIdServiceMock.areSignedFileHashesValid).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                mobileUid: args.headers.mobileUid,
                files: args.params.files,
                returnOriginals: args.params.returnOriginals,
                signAlgo: args.params.signAlgo,
            })
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
