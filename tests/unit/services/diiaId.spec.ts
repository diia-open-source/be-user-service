const uuidV4Stub = jest.fn()

jest.mock('uuid', () => ({ v4: uuidV4Stub }))

import { randomUUID } from 'node:crypto'

import moment from 'moment'

import { IdentifierService } from '@diia-inhouse/crypto'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { ExternalCommunicator, ExternalEventBus } from '@diia-inhouse/diia-queue'
import { EnvService } from '@diia-inhouse/env'
import { AccessDeniedError, ApiError, InternalServerError, ModelNotFoundError, NotFoundError } from '@diia-inhouse/errors'
import { I18nService } from '@diia-inhouse/i18n'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { AppUser, HttpStatusCode, SessionType } from '@diia-inhouse/types'

const diiaIdModel = {
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
    modelName: 'DiiaId',
}

jest.mock('@models/diiaId', () => diiaIdModel)

import AuthService from '@services/auth'
import DiiaIdService from '@services/diiaId'
import DocumentsService from '@services/documents'
import EResidentDiiaIdConfirmationService from '@services/eResidentDiiaIdConfirmation'
import SuperGenService from '@services/superGen'
import UserSigningHistoryService from '@services/userSigningHistory'

import { Locales } from '@interfaces/locales'
import { SignAlgo } from '@interfaces/models/diiaId'
import { AttentionMessageParameterType, ProcessCode } from '@interfaces/services'
import { IdentityDocumentType, PassportType } from '@interfaces/services/documents'

describe(`Service ${DiiaIdService.name}`, () => {
    const now = new Date()
    const testKit = new TestKit()
    const documentsService = mockInstance(DocumentsService)
    const superGenService = mockInstance(SuperGenService)
    const userSigningHistoryService = mockInstance(UserSigningHistoryService)
    const authService = mockInstance(AuthService)
    const i18nService = mockInstance(I18nService<Locales>)
    const envService = mockInstance(EnvService)
    const externalEventBus = mockInstance(ExternalEventBus)
    const external = mockInstance(ExternalCommunicator)
    const diiaLogger = mockInstance(DiiaLogger)
    const eResidentDiiaIdConfirmationService = mockInstance(EResidentDiiaIdConfirmationService)
    const identifierService = mockInstance(IdentifierService)

    const service = new DiiaIdService(
        documentsService,
        superGenService,
        userSigningHistoryService,
        authService,
        i18nService,
        envService,
        externalEventBus,
        external,
        diiaLogger,
        eResidentDiiaIdConfirmationService,
        identifierService,
    )
    const { user } = testKit.session.getUserSession()
    const headers = testKit.session.getHeaders()
    const dateFormat = 'DD.MM.YYYY'

    const identityDocument = {
        identityType: IdentityDocumentType.InternalPassport,
        docNumber: 'docNumber',
        lastNameUA: 'lastNameUA',
        firstNameUA: 'firstNameUA',
        firstNameEN: 'firstNameEN',
        lastNameEN: 'lastNameEN',
        photo: 'photo',
        sign: 'sign',
        recordNumber: 'recordNumber',
    }

    const diiaId = {
        userIdentifier: user.identifier,
        mobileUid: headers.mobileUid,
        identifier: user.identifier,
        isDeleted: false,
        signAlgo: SignAlgo.DSTU,
    }

    const undefinedValue = undefined

    beforeEach(() => {
        jest.useFakeTimers({ now })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe(`method ${service.getIdentifierAvailability.name}`, () => {
        it('should return active diia ids with identifiers and sign algo', async () => {
            const diiaIdsWithExpiredCreation = [{ mobileUid: headers.mobileUid, signAlgo: 'signAlgo' }]

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce(diiaIdsWithExpiredCreation)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])

            const diiaIds = [
                {
                    mobileUid: headers.mobileUid,
                    signAlgo: 'signAlgo',
                    creationDate: new Date(),
                    expirationDate: new Date(),
                    identifier: randomUUID(),
                },
            ]

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce(diiaIds)

            const result = [{ identifier: diiaIds[0].identifier, signAlgo: diiaIds[0].signAlgo }]

            expect(await service.getIdentifierAvailability(user.identifier, headers.mobileUid)).toMatchObject(result)
            expect(diiaLogger.info).toHaveBeenCalledWith('Start soft delete Diia Id')
        })
    })

    describe(`method ${service.createDiiaId.name}`, () => {
        it('should throw InternalServerError if failed to create certificate', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(superGenService, 'generateDiiaIdAgreement').mockResolvedValueOnce('document')
            jest.spyOn(superGenService, 'generatePassport').mockResolvedValueOnce('document')
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(false)

            await expect(service.createDiiaId(user, headers.mobileUid, SignAlgo.DSTU, identityDocument)).rejects.toThrow(
                new InternalServerError('Failed to create certificate'),
            )
        })

        it('should throw TypeError if failed to create certificate due to wrong session type', async () => {
            const { user: localUser } = testKit.session.getEResidentApplicantSession()
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])

            await expect(
                service.createDiiaId(<AppUser>(<unknown>localUser), headers.mobileUid, SignAlgo.DSTU, identityDocument),
            ).rejects.toThrow(new TypeError(`Unhandled session type: ${localUser.sessionType}`))
        })

        it('should throw TypeError if failed to create certificate due to wrong sign algo', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])

            await expect(service.createDiiaId(user, headers.mobileUid, <SignAlgo>'wrong-algo', identityDocument)).rejects.toThrow(
                new TypeError(`Unhandled sign algo type: ${<SignAlgo>'wrong-algo'}`),
            )
        })

        it('should throw InternalServerError if failed to create diia id', async () => {
            const diiaIds = [{ mobileUid: headers.mobileUid, signAlgo: 'signAlgo' }]
            const errorMsg = 'Failed to create diia id'

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce(diiaIds)
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            jest.spyOn(documentsService, 'getIdentityDocument').mockResolvedValueOnce(identityDocument)
            jest.spyOn(superGenService, 'generateDiiaIdAgreement').mockResolvedValueOnce('document')
            jest.spyOn(superGenService, 'generatePassport').mockResolvedValueOnce('document')
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)
            jest.spyOn(diiaIdModel, 'create').mockRejectedValueOnce(new Error('error'))

            await expect(service.createDiiaId(user, headers.mobileUid, SignAlgo.DSTU)).rejects.toThrow(new InternalServerError(errorMsg))
        })

        it('should successfully create identifier and return it', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)
            jest.spyOn(documentsService, 'getIdentityDocument').mockResolvedValueOnce(identityDocument)
            jest.spyOn(diiaIdModel, 'create').mockResolvedValueOnce(true)

            expect(await service.createDiiaId(user, headers.mobileUid, SignAlgo.DSTU)).toBe(requestUuid)
        })

        it('should successfully create identifier with e-resident and return it', async () => {
            const localUser = testKit.session.getEResidentSession().user

            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(documentsService, 'getIdentityDocument').mockResolvedValueOnce(identityDocument)
            jest.spyOn(superGenService, 'generateEResidentDiiaIdAgreement').mockResolvedValueOnce('document')
            jest.spyOn(superGenService, 'generateEResidentPassport').mockResolvedValueOnce('document')
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            expect(await service.createDiiaId(localUser, headers.mobileUid, SignAlgo.ECDSA)).toBe(requestUuid)
        })

        it('should throw ApiError if failed to receive identity document', async () => {
            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)
            jest.spyOn(documentsService, 'getIdentityDocument').mockRejectedValueOnce(new NotFoundError('error'))

            await expect(service.createDiiaId(user, headers.mobileUid, SignAlgo.DSTU)).rejects.toThrow(
                new ApiError('Identity document not received', 404, {}, HttpStatusCode.NOT_FOUND),
            )
        })
    })

    describe(`method ${service.createDiiaIds.name}`, () => {
        it('should return diia ids with ResidencePermitPermanent document type', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            const localIdentityDocument = { ...identityDocument, identityType: IdentityDocumentType.ResidencePermitPermanent }

            jest.spyOn(documentsService, 'getIdentityDocument').mockResolvedValueOnce(localIdentityDocument)
            jest.spyOn(superGenService, 'generateResidencePermit').mockResolvedValueOnce('document')

            expect(await service.createDiiaIds(user, headers.mobileUid, [SignAlgo.DSTU])).toMatchObject([
                { identifier: requestUuid, signAlgo: SignAlgo.DSTU },
            ])
        })

        it('should return diia ids with ForeignPassport document type', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            const localIdentityDocument = { ...identityDocument, identityType: IdentityDocumentType.ForeignPassport }

            jest.spyOn(documentsService, 'getIdentityDocument').mockResolvedValueOnce(localIdentityDocument)
            jest.spyOn(superGenService, 'generatePassport').mockResolvedValueOnce('document')

            expect(await service.createDiiaIds(user, headers.mobileUid, [SignAlgo.DSTU])).toMatchObject([
                { identifier: requestUuid, signAlgo: SignAlgo.DSTU },
            ])
        })

        it('should return diia ids with EResidentPassport document type', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            const localIdentityDocument = { ...identityDocument, identityType: IdentityDocumentType.EResidentPassport }

            jest.spyOn(documentsService, 'getIdentityDocument').mockResolvedValueOnce(localIdentityDocument)
            jest.spyOn(superGenService, 'generateEResidentPassport').mockResolvedValueOnce('document')

            expect(await service.createDiiaIds(user, headers.mobileUid, [SignAlgo.DSTU])).toMatchObject([
                { identifier: requestUuid, signAlgo: SignAlgo.DSTU },
            ])
        })

        it('should throw TypeError if Unhandled identity type', async () => {
            const identityType = <IdentityDocumentType>'wrong-identity-type'
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            const localIdentityDocument = { ...identityDocument, identityType: <IdentityDocumentType>'wrong-identity-type' }

            jest.spyOn(documentsService, 'getIdentityDocument').mockResolvedValueOnce(localIdentityDocument)
            await expect(service.createDiiaIds(user, headers.mobileUid, [SignAlgo.DSTU])).rejects.toThrow(
                new TypeError(`Unhandled identity type: ${identityType}`),
            )
        })
    })

    describe(`method ${service.handleCreateCertificateResponse.name}`, () => {
        const certificateSerialNumber = randomUUID()
        const registryUserIdentifier = randomUUID()
        const creationDate = now
        const expirationDate = now

        it('should throw ModelNotFoundError if model not found', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(undefinedValue)

            await expect(
                service.handleCreateCertificateResponse({
                    certificateSerialNumber,
                    registryUserIdentifier,
                    identifier: user.identifier,
                    creationDate,
                    expirationDate,
                    signAlgo: SignAlgo.DSTU,
                }),
            ).rejects.toThrow(new ModelNotFoundError(diiaIdModel.modelName, user.identifier))
        })

        it('should throw ModelNotFoundError if failed to handle create certificate response', async () => {
            const err = new Error('error')

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(diiaId)
            jest.spyOn(diiaIdModel, 'updateOne').mockRejectedValueOnce(err)

            expect(
                await service.handleCreateCertificateResponse({
                    certificateSerialNumber,
                    registryUserIdentifier,
                    identifier: user.identifier,
                    creationDate,
                    expirationDate,
                    signAlgo: SignAlgo.DSTU,
                }),
            ).toBeUndefined()
            expect(diiaLogger.error).toHaveBeenCalledWith('Error while handle create certificate response', { err })
        })

        it('should successfully handle create certificate response', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(diiaId)
            jest.spyOn(diiaIdModel, 'updateOne').mockResolvedValueOnce(true)
            jest.spyOn(identifierService, 'getSessionTypeFromIdentifier').mockReturnValueOnce(SessionType.EResident)
            jest.spyOn(diiaIdModel, 'countDocuments').mockResolvedValueOnce(0)
            jest.spyOn(eResidentDiiaIdConfirmationService, 'confirmEresidentCreation').mockResolvedValueOnce()
            expect(
                await service.handleCreateCertificateResponse({
                    certificateSerialNumber,
                    registryUserIdentifier,
                    identifier: user.identifier,
                    creationDate,
                    expirationDate,
                    signAlgo: SignAlgo.DSTU,
                }),
            ).toBeUndefined()
        })
    })

    describe(`method ${service.getIdentifierV1.name}`, () => {
        it('should return if not found diiaId model', async () => {
            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(undefinedValue)

            expect(await service.getIdentifierV1(user, headers.mobileUid, SignAlgo.DSTU)).toBeUndefined()
        })

        it('should throw AccessDeniedError if diia id certificate still in a process of creation', async () => {
            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(diiaId)

            await expect(service.getIdentifierV1(user, headers.mobileUid, SignAlgo.DSTU)).rejects.toThrow(
                new AccessDeniedError('Diia id certificate still in a process of creation', { identifier: diiaId.identifier }),
            )
        })

        it('should fail to retrieve passport', async () => {
            const localDiiaId = { ...diiaId, creationDate: now, expirationDate: now }
            const err = new NotFoundError('not found')

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(documentsService, 'getPassportToProcess').mockRejectedValueOnce(err)
            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])

            expect(await service.getIdentifierV1(user, headers.mobileUid, SignAlgo.DSTU)).toBeUndefined()
            expect(diiaLogger.error).toHaveBeenCalledWith('Failed to retrieve passport to process', { err })
        })

        it('should return identifier', async () => {
            const localDiiaId = { ...diiaId, creationDate: now, expirationDate: now }

            const passport = {
                docNumber: 'docNumber',
                lastNameUA: 'lastNameUA',
                firstNameUA: 'firstNameUA',
                middleNameUA: 'middleNameUA',
                photo: 'photo',
                sign: 'sign',
                countryCode: 'countryCode',
                recordNumber: 'recordNumber',
                type: PassportType.ID,
            }

            const result = {
                identifier: diiaId.identifier,
                creationDate: moment(now).format(dateFormat),
                expirationDate: moment(now).format(dateFormat),
                passport: {
                    docNumber: passport.docNumber,
                    lastNameUA: passport.lastNameUA,
                    firstNameUA: passport.firstNameUA,
                    middleNameUA: passport.middleNameUA,
                    photo: passport.photo,
                    sign: passport.sign,
                },
            }

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(documentsService, 'getPassportToProcess').mockResolvedValueOnce(passport)
            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])

            expect(await service.getIdentifierV1(user, headers.mobileUid, SignAlgo.DSTU)).toMatchObject(result)
        })
    })

    describe(`method ${service.getIdentifierV2.name}`, () => {
        it('should return not active diia id info', async () => {
            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(diiaId)
            jest.spyOn(userSigningHistoryService, 'countHistory').mockResolvedValueOnce(1)
            jest.spyOn(i18nService, 'get').mockReturnValue('test')

            const result = {
                description: 'test',
                attentionMessage: {
                    text: 'test',
                    icon: '☝️',
                    parameters: [
                        {
                            type: AttentionMessageParameterType.Link,
                            data: {
                                name: 'link1',
                                alt: 'test',
                                resource: 'https://ca.diia.gov.ua/diia_signature_application',
                            },
                        },
                    ],
                },
                hasSigningHistory: true,
            }

            expect(await service.getIdentifierV2(user, headers, SignAlgo.DSTU)).toMatchObject(result)
        })

        it('should return active diia id info', async () => {
            const localDiiaId = { ...diiaId, creationDate: now, expirationDate: now }

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(userSigningHistoryService, 'countHistory').mockResolvedValueOnce(1)
            jest.spyOn(i18nService, 'get').mockReturnValue('test')

            const result = {
                identifier: localDiiaId.identifier,
                hasSigningHistory: true,
                stubMessage: undefined,
            }

            expect(await service.getIdentifierV2(user, headers, SignAlgo.DSTU)).toMatchObject(result)
        })

        it('should return active diia id info without signing history', async () => {
            const localDiiaId = { ...diiaId, creationDate: now, expirationDate: now }

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(userSigningHistoryService, 'countHistory').mockResolvedValueOnce(0)
            jest.spyOn(i18nService, 'get').mockReturnValue('test')

            const result = {
                identifier: localDiiaId.identifier,
                hasSigningHistory: false,
                stubMessage: {
                    icon: '🤷‍♂️',
                    text: 'test',
                },
            }

            expect(await service.getIdentifierV2(user, headers, SignAlgo.DSTU)).toMatchObject(result)
        })
    })

    describe(`method ${service.getIdentifiersV1.name}`, () => {
        it('should return no available diia id info', async () => {
            const diiaIdsWithExpiredCreation = [
                {
                    userIdentifier: user.identifier,
                    mobileUid: headers.mobileUid,
                    identifier: user.identifier,
                    isDeleted: false,
                    signAlgo: SignAlgo.DSTU,
                },
            ]

            jest.spyOn(diiaIdModel, 'find').mockResolvedValue(diiaIdsWithExpiredCreation)
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(diiaId)
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(userSigningHistoryService, 'countHistory').mockResolvedValueOnce(0)
            jest.spyOn(i18nService, 'get').mockReturnValue('test')

            const result = {
                identifiers: [],
                description: 'test',
                attentionMessage: {
                    text: 'test',
                    icon: '☝️',
                    parameters: [
                        {
                            type: AttentionMessageParameterType.Link,
                            data: {
                                name: 'link1',
                                alt: 'test',
                                resource: 'https://ca.diia.gov.ua/diia_signature_application',
                            },
                        },
                    ],
                },
                hasSigningHistory: false,
            }

            expect(await service.getIdentifiersV1(user, headers)).toMatchObject(result)
        })

        it('should return diia id info', async () => {
            const localDiiaId = { ...diiaId, creationDate: now, expirationDate: now }

            const diiaIdsWithExpiredCreation = [
                {
                    userIdentifier: user.identifier,
                    mobileUid: headers.mobileUid,
                    identifier: user.identifier,
                    isDeleted: false,
                    signAlgo: SignAlgo.DSTU,
                },
            ]

            jest.spyOn(diiaIdModel, 'find').mockResolvedValue(diiaIdsWithExpiredCreation)
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(userSigningHistoryService, 'countHistory').mockResolvedValueOnce(1)
            jest.spyOn(i18nService, 'get').mockReturnValue('test')

            const result = {
                identifiers: [{ identifier: localDiiaId.identifier, signAlgo: localDiiaId.signAlgo }],
                hasSigningHistory: true,
                stubMessage: undefined,
            }

            expect(await service.getIdentifiersV1(user, headers)).toMatchObject(result)
        })

        it('should return diia id info without signing history', async () => {
            const localDiiaId = { ...diiaId, creationDate: now, expirationDate: now }

            const diiaIdsWithExpiredCreation = [
                {
                    userIdentifier: user.identifier,
                    mobileUid: headers.mobileUid,
                    identifier: user.identifier,
                    isDeleted: false,
                    signAlgo: SignAlgo.DSTU,
                },
            ]

            jest.spyOn(diiaIdModel, 'find').mockResolvedValue(diiaIdsWithExpiredCreation)
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(userSigningHistoryService, 'countHistory').mockResolvedValueOnce(0)
            jest.spyOn(i18nService, 'get').mockReturnValue('test')

            const result = {
                identifiers: [{ identifier: localDiiaId.identifier, signAlgo: localDiiaId.signAlgo }],
                hasSigningHistory: false,
                stubMessage: {
                    icon: '🤷‍♂️',
                    text: 'test',
                },
            }

            expect(await service.getIdentifiersV1(user, headers)).toMatchObject(result)
        })
    })

    describe(`method ${service.getIdentifiers.name}`, () => {
        it('should return no available diia id info', async () => {
            const diiaIdsWithExpiredCreation = [
                {
                    userIdentifier: user.identifier,
                    mobileUid: headers.mobileUid,
                    identifier: user.identifier,
                    isDeleted: false,
                    signAlgo: SignAlgo.DSTU,
                },
            ]

            jest.spyOn(diiaIdModel, 'find').mockResolvedValue(diiaIdsWithExpiredCreation)
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(diiaId)
            jest.spyOn(i18nService, 'get').mockReturnValue('test')

            const result = {
                identifiers: [],
                description: 'test',
                attentionMessage: {
                    text: 'test',
                    icon: '☝️',
                    parameters: [
                        {
                            type: AttentionMessageParameterType.Link,
                            data: {
                                name: 'link1',
                                alt: 'test',
                                resource: 'https://ca.diia.gov.ua/diia_signature_application',
                            },
                        },
                    ],
                },
                buttonHistoryName: 'test',
            }

            expect(await service.getIdentifiers(user, headers)).toMatchObject(result)
        })

        it('should return diia id info', async () => {
            const localDiiaId = { ...diiaId, creationDate: now, expirationDate: now }

            const diiaIdsWithExpiredCreation = [
                {
                    userIdentifier: user.identifier,
                    mobileUid: headers.mobileUid,
                    identifier: user.identifier,
                    isDeleted: false,
                    signAlgo: SignAlgo.DSTU,
                },
            ]

            jest.spyOn(diiaIdModel, 'find').mockResolvedValue(diiaIdsWithExpiredCreation)
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(i18nService, 'get').mockReturnValue('test')

            const result = {
                identifiers: [{ identifier: localDiiaId.identifier, signAlgo: localDiiaId.signAlgo }],
                buttonHistoryName: 'test',
            }

            expect(await service.getIdentifiers(user, headers)).toMatchObject(result)
        })
    })

    describe(`method ${service.hasIdentifier.name}`, () => {
        const mobileUidToFilter = 'mobileUidToFilter'

        it('should return false if diia model not found', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(undefinedValue)

            expect(await service.hasIdentifier(user.identifier, mobileUidToFilter)).toBeFalsy()
        })

        it('should throw AccessDeniedError if diia id certificate still in a process of creation', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(diiaId)

            await expect(service.hasIdentifier(user.identifier, mobileUidToFilter)).rejects.toThrow(
                new AccessDeniedError(
                    'Diia id certificate still in a process of creation',
                    { identifier: diiaId.identifier },
                    ProcessCode.DiiaIdInCreationProcess,
                ),
            )
        })

        it('should true if user has identifier', async () => {
            const localDiiaId = { ...diiaId, creationDate: now, expirationDate: now }

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)

            expect(await service.hasIdentifier(user.identifier, mobileUidToFilter)).toBeTruthy()
        })
    })

    describe(`method ${service.softDeleteDiiaIdBasedOnPassport.name}`, () => {
        it('should successfully soft delete diia id with passport', async () => {
            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const localDiiaId = {
                ...diiaId,
                creationDate: now,
                expirationDate: now,
                certificateSerialNumber: 'certificateSerialNumber',
                registryUserIdentifier: 'registryUserIdentifier',
            }

            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([localDiiaId])
            jest.spyOn(diiaIdModel, 'findByIdAndUpdate').mockResolvedValueOnce(true)
            jest.spyOn(authService, 'revokeSubmitAfterUserAuthSteps').mockResolvedValueOnce({ success: true, revokedActions: 1 })
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            expect(await service.softDeleteDiiaIdBasedOnPassport(user.identifier)).toBeTruthy()
        })
    })

    describe(`method ${service.hardDeleteIdentifierByEventUuid.name}`, () => {
        const eventUuid = 'eventUuid'

        it('should successfully', async () => {
            jest.spyOn(diiaIdModel, 'deleteOne').mockResolvedValueOnce({ deletedCount: 1 })

            await service.hardDeleteIdentifierByEventUuid(eventUuid)

            expect(diiaLogger.info).toHaveBeenCalledWith('Deleted diia id entity', { eventUuid, deletedCount: 1 })
        })
    })

    describe(`method ${service.handleUnsuccessRevoking.name}`, () => {
        const eventUuid = 'eventUuid'

        it('should successfully', async () => {
            jest.spyOn(diiaIdModel, 'updateOne').mockResolvedValueOnce({ modifiedCount: 1 })

            await service.handleUnsuccessRevoking(eventUuid)

            expect(diiaLogger.info).toHaveBeenCalledWith('Updated diia id entity with unsuccess revoking', {
                eventUuid,
                modifiedCount: 1,
                error: 'unknown',
            })
        })
    })

    describe(`method ${service.hashFilesToSign.name}`, () => {
        it('should throw ModelNotFoundError if diia id not found', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(undefinedValue)

            await expect(service.hashFilesToSign(user, headers.mobileUid, [], SignAlgo.DSTU)).rejects.toThrow(
                new ModelNotFoundError(diiaIdModel.modelName, user.identifier),
            )
        })

        it('should return hash files to sign', async () => {
            const localDiiaId = {
                ...diiaId,
                creationDate: now,
                expirationDate: now,
                certificateSerialNumber: 'certificateSerialNumber',
                registryUserIdentifier: 'registryUserIdentifier',
            }

            const hashes = [{ name: 'name', hash: 'hash' }]

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(external, 'receive').mockResolvedValueOnce({ identifier: user.identifier, hashes })

            expect(await service.hashFilesToSign(user, headers.mobileUid, [], SignAlgo.DSTU)).toMatchObject(hashes)
        })
    })

    describe(`method ${service.getDpsHashFilesToSign.name}`, () => {
        it('should throw ModelNotFoundError if diia id not found', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(undefinedValue)

            await expect(service.getDpsHashFilesToSign(user.identifier, headers.mobileUid, [], SignAlgo.DSTU)).rejects.toThrow(
                new ModelNotFoundError(diiaIdModel.modelName, user.identifier),
            )
        })

        it('should return dps hash files to sign', async () => {
            const localDiiaId = {
                ...diiaId,
                creationDate: now,
                expirationDate: now,
                certificateSerialNumber: 'certificateSerialNumber',
                registryUserIdentifier: 'registryUserIdentifier',
            }

            const hashes = [{ name: 'name', hash: 'hash' }]

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(external, 'receive').mockResolvedValueOnce({ identifier: user.identifier, hashes })

            expect(await service.getDpsHashFilesToSign(user.identifier, headers.mobileUid, [], SignAlgo.DSTU)).toMatchObject(hashes)
        })
    })

    describe(`method ${service.getDpsPreparedPackage.name}`, () => {
        it('should throw ModelNotFoundError if diia id not found', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(undefinedValue)

            await expect(service.getDpsPreparedPackage(user.identifier, headers.mobileUid, SignAlgo.DSTU)).rejects.toThrow(
                new ModelNotFoundError(diiaIdModel.modelName, user.identifier),
            )
        })

        it('should return dps prepared package', async () => {
            const localDiiaId = {
                ...diiaId,
                creationDate: now,
                expirationDate: now,
                certificateSerialNumber: 'certificateSerialNumber',
                registryUserIdentifier: 'registryUserIdentifier',
            }

            const inReportDaoArray = [{ fname: 'fname', contentBase64: 'contentBase64' }]

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(external, 'receive').mockResolvedValueOnce({ identifier: user.identifier, inReportDaoArray })

            expect(await service.getDpsPreparedPackage(user.identifier, headers.mobileUid, SignAlgo.DSTU)).toMatchObject(inReportDaoArray)
        })
    })

    describe(`method ${service.getDiiaIdByIdentifier.name}`, () => {
        it('should throw ModelNotFoundError if diia id not found', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(undefinedValue)

            await expect(service.getDiiaIdByIdentifier(user.identifier)).rejects.toThrow(
                new ModelNotFoundError(diiaIdModel.modelName, user.identifier),
            )
        })

        it('should return diia id', async () => {
            const localDiiaId = {
                ...diiaId,
                creationDate: now,
                expirationDate: now,
                certificateSerialNumber: 'certificateSerialNumber',
                registryUserIdentifier: 'registryUserIdentifier',
            }

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)

            expect(await service.getDiiaIdByIdentifier(user.identifier)).toMatchObject(localDiiaId)
        })
    })

    describe(`method ${service.areSignedFileHashesValid.name}`, () => {
        it('should throw ModelNotFoundError if diia id not found', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(undefinedValue)

            await expect(
                service.areSignedFileHashesValid({
                    userIdentifier: user.identifier,
                    mobileUid: headers.mobileUid,
                    files: [],
                    returnOriginals: false,
                    signAlgo: SignAlgo.DSTU,
                }),
            ).rejects.toThrow(new ModelNotFoundError(diiaIdModel.modelName, headers.mobileUid))
        })

        it('should return signed file hashes valid result', async () => {
            const localDiiaId = {
                ...diiaId,
                creationDate: now,
                expirationDate: now,
                certificateSerialNumber: 'certificateSerialNumber',
                registryUserIdentifier: 'registryUserIdentifier',
            }

            const checkResults = [{ name: 'name', checked: true }]

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(external, 'receive').mockResolvedValueOnce({ identifier: user.identifier, checkResults })

            expect(
                await service.areSignedFileHashesValid({
                    userIdentifier: user.identifier,
                    mobileUid: headers.mobileUid,
                    files: [],
                    returnOriginals: false,
                    signAlgo: SignAlgo.DSTU,
                }),
            ).toMatchObject({ areValid: true, checkResults })
        })
    })

    describe(`method ${service.initHashesSigning.name}`, () => {
        it('should throw ModelNotFoundError if diia id not found', async () => {
            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(undefinedValue)

            await expect(
                service.initHashesSigning({
                    userIdentifier: user.identifier,
                    mobileUid: headers.mobileUid,
                    signAlgo: SignAlgo.DSTU,
                }),
            ).rejects.toThrow(new ModelNotFoundError(diiaIdModel.modelName, user.identifier))
        })

        it('should return true if init hashes signing', async () => {
            const localDiiaId = {
                ...diiaId,
                creationDate: now,
                expirationDate: now,
                certificateSerialNumber: 'certificateSerialNumber',
                registryUserIdentifier: 'registryUserIdentifier',
            }

            jest.spyOn(diiaIdModel, 'findOne').mockResolvedValueOnce(localDiiaId)
            jest.spyOn(externalEventBus, 'publish').mockResolvedValueOnce(true)

            expect(
                await service.initHashesSigning({
                    userIdentifier: user.identifier,
                    mobileUid: headers.mobileUid,
                    signAlgo: SignAlgo.DSTU,
                }),
            ).toBeTruthy()
        })
    })

    describe(`method ${service.softDeleteDiiaIdByIdentityDocument.name}`, () => {
        it('should return if not identity document', async () => {
            expect(await service.softDeleteDiiaIdByIdentityDocument(user.identifier, headers.mobileUid, 'wrong-document-type')).toBeFalsy()
        })

        it('should successfully soft delete diia id by identity document', async () => {
            jest.spyOn(diiaIdModel, 'find').mockResolvedValueOnce([])

            expect(await service.softDeleteDiiaIdByIdentityDocument(user.identifier, headers.mobileUid, 'internal-passport')).toBeFalsy()

            expect(diiaLogger.info).toHaveBeenCalledWith('Start soft delete Diia Id')
        })
    })
})
