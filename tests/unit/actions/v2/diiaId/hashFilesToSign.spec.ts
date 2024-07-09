import { randomUUID } from 'node:crypto'

const uuidV4Stub = jest.fn()

jest.mock('uuid', () => ({ v4: uuidV4Stub }))

import { IdentifierService } from '@diia-inhouse/crypto'
import { AccessDeniedError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import HashFilesToSignAction from '@actions/v2/diiaId/hashFilesToSign'

import DiiaIdService from '@services/diiaId'
import UserSigningHistoryService from '@services/userSigningHistory'

import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${HashFilesToSignAction.name}`, () => {
    const now = new Date()
    const testKit = new TestKit()
    const diiaIdService = mockInstance(DiiaIdService)
    const userSigningHistoryService = mockInstance(UserSigningHistoryService)
    const identifierService = mockInstance(IdentifierService)

    const action = new HashFilesToSignAction(diiaIdService, userSigningHistoryService, identifierService)

    const args = {
        params: {
            files: [
                {
                    name: 'name',
                    file: 'file',
                    isRequireInternalSign: true,
                },
            ],
            publicService: 'publicService',
            applicationId: 'applicationId',
            documents: ['doc1'],
            recipient: { name: 'name', address: 'address' },
            options: {
                signType: DiiaIdSignType.EU_SIGN_TYPE_CADES_BES,
                noSigningTime: true,
                noContentTimestamp: true,
            },
            signAlgo: SignAlgo.DSTU,
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
        it('should throw AccessDeniedError if failed to hash files', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const sessionId = randomUUID()
            const err = new AccessDeniedError('failed to hash files', {}, ProcessCode.RegistryUnavailableWhenSigning)

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(diiaIdService, 'hashFilesToSign').mockRejectedValueOnce(err)
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
                noSigningTime: args.params.options.noSigningTime,
                noContentTimestamp: args.params.options.noContentTimestamp,
            })
        })

        it('should throw Error if failed to hash files', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const sessionId = randomUUID()
            const err = new Error('failed to hash files')

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(diiaIdService, 'hashFilesToSign').mockRejectedValueOnce(err)

            await expect(action.handler(args)).rejects.toEqual(err)

            expect(diiaIdService.hashFilesToSign).toHaveBeenCalledWith(
                args.session.user,
                args.headers.mobileUid,
                args.params.files,
                args.params.signAlgo,
                args.params.options,
            )
        })

        it('should return hashed files', async () => {
            const sessionId = randomUUID()
            const hashedFiles = [{ name: 'name', hash: 'hash' }]

            jest.spyOn(identifierService, 'createIdentifier').mockReturnValueOnce(sessionId)

            jest.spyOn(diiaIdService, 'hashFilesToSign').mockResolvedValueOnce(hashedFiles)

            jest.spyOn(userSigningHistoryService, 'upsertItem').mockResolvedValueOnce()

            expect(await action.handler(args)).toMatchObject({ hashedFiles })

            expect(diiaIdService.hashFilesToSign).toHaveBeenCalledWith(
                args.session.user,
                args.headers.mobileUid,
                args.params.files,
                args.params.signAlgo,
                args.params.options,
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
                noSigningTime: args.params.options.noSigningTime,
                noContentTimestamp: args.params.options.noContentTimestamp,
            })
        })
    })
})
