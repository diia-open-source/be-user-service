import { randomUUID } from 'crypto'

const userDocumentModelMock = {
    bulkWrite: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    findOne: jest.fn(),
    aggregate: jest.fn(),
    distinct: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
    findOneAndDelete: jest.fn(),
    sort: jest.fn(),
    lean: jest.fn(),
    modelName: 'UserDocument',
}

const momentStubs = {
    add: jest.fn(),
    toDate: jest.fn(),
    startOf: jest.fn(),
    endOf: jest.fn(),
    moment: jest.fn(),
}

jest.mock('@models/userDocument', () => userDocumentModelMock)
jest.mock('moment', () => momentStubs.moment)

import { BulkWriteResult } from 'mongodb'

import { AnalyticsCategory } from '@diia-inhouse/analytics'
import Logger from '@diia-inhouse/diia-logger'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocStatus, DocumentType, DurationMs, OwnerType, UserDocumentSubtype } from '@diia-inhouse/types'

import AnalyticsService from '@services/analytics'
import DiiaIdService from '@services/diiaId'
import NotificationService from '@services/notification'
import UserDocumentService from '@services/userDocument'

import { AnalyticsActionType } from '@interfaces/services/analytics'
import { UserProfileDocument } from '@interfaces/services/documents'
import { MessageTemplateCode, TemplateStub } from '@interfaces/services/notification'

describe(`Service ${UserDocumentService.name}`, () => {
    const testKit = new TestKit()
    const analyticsService = mockInstance(AnalyticsService)
    const diiaIdService = mockInstance(DiiaIdService)
    const logger = mockInstance(Logger)
    const notificationService = mockInstance(NotificationService)
    const now = new Date()

    const userDocumentService = new UserDocumentService(analyticsService, diiaIdService, notificationService, logger)

    beforeAll(() => {
        jest.useFakeTimers({ now })
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    describe(`method ${userDocumentService.updateDocuments.name}`, () => {
        it('should add new document if it does not exist', async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { user } = session
            const { identifier: userIdentifier } = user
            const { mobileUid } = headers
            const documentType = DocumentType.DriverLicense
            const documentIdentifier = randomUUID()
            const ownerType = OwnerType.owner
            const docId = randomUUID()
            const docStatus = DocStatus.Ok
            const registrationDate = new Date(Date.now() - DurationMs.Day)
            const document = {
                docId,
                docStatus,
                documentIdentifier,
                documentType,
                ownerType,
                registrationDate,
                userIdentifier,
                notifications: {},
            }

            const userDocumentsFindSpy = userDocumentModelMock.find.mockResolvedValueOnce([])
            const userDocumentsBulkWriteSpy = userDocumentModelMock.bulkWrite.mockResolvedValueOnce({})
            const analyticsLogSpy = jest.spyOn(analyticsService, 'log')

            await userDocumentService.updateDocuments(userIdentifier, documentType, [document], mobileUid, headers, false)

            expect(userDocumentsFindSpy).toHaveBeenCalledWith({ userIdentifier, documentType })
            expect(analyticsLogSpy).toHaveBeenCalledWith(
                AnalyticsCategory.Users,
                userIdentifier,
                { documentType, documentId: documentIdentifier, ownerType },
                AnalyticsActionType.AddDocument,
                headers,
            )
            expect(userDocumentsBulkWriteSpy).toHaveBeenCalledWith([{ insertOne: { document } }])
        })

        it('should search for device-related documents if device-related document type was passed', async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { mobileUid } = headers
            const { user } = session
            const { identifier: userIdentifier } = user
            const documentType = DocumentType.MilitaryBond
            const documentIdentifier = randomUUID()
            const ownerType = OwnerType.owner
            const docId = randomUUID()
            const docStatus = DocStatus.Ok
            const registrationDate = new Date(Date.now() - DurationMs.Day)
            const document = { docId, docStatus, documentIdentifier, documentType, ownerType, registrationDate, userIdentifier }

            const userDocumentsFindSpy = userDocumentModelMock.find.mockResolvedValueOnce([])

            userDocumentModelMock.bulkWrite.mockResolvedValueOnce({})

            await userDocumentService.updateDocuments(userIdentifier, documentType, [document], mobileUid, headers, false)

            expect(userDocumentsFindSpy).toHaveBeenCalledWith({ userIdentifier, documentType, mobileUid })
        })

        it(`should remove all documents if no documents to update was passed`, async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { mobileUid } = headers
            const { user } = session
            const { identifier: userIdentifier } = user
            const documentType = DocumentType.InternationalVaccinationCertificate
            const ownerType = OwnerType.owner
            const document1 = {
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomUUID(),
                documentType,
                ownerType,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
                _id: randomUUID(),
                mobileUid,
            }
            const document2 = {
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomUUID(),
                documentType,
                ownerType,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
                _id: randomUUID(),
                mobileUid,
            }

            const userDocumentsFindSpy = userDocumentModelMock.find.mockResolvedValueOnce([document1, document2])
            const userDocumentsBulkWriteSpy = userDocumentModelMock.bulkWrite.mockResolvedValueOnce({})
            const analyticsLogSpy = jest.spyOn(analyticsService, 'log')
            const softDeleteDiiaIdByIdentityDocumentSpy = jest.spyOn(diiaIdService, 'softDeleteDiiaIdByIdentityDocument')

            await userDocumentService.updateDocuments(userIdentifier, documentType, [], mobileUid, headers, true)

            expect(userDocumentsFindSpy).toHaveBeenCalledWith({ userIdentifier, documentType, mobileUid })
            expect(analyticsLogSpy).toHaveBeenCalledWith(
                AnalyticsCategory.Users,
                userIdentifier,
                { documentType, documentId: document1.documentIdentifier, ownerType },
                AnalyticsActionType.RemoveDocument,
                headers,
            )
            expect(analyticsLogSpy).toHaveBeenCalledWith(
                AnalyticsCategory.Users,
                userIdentifier,
                { documentType, documentId: document2.documentIdentifier, ownerType },
                AnalyticsActionType.RemoveDocument,
                headers,
            )
            expect(userDocumentsBulkWriteSpy).toHaveBeenCalledWith([
                { deleteOne: { filter: { _id: document1._id } } },
                { deleteOne: { filter: { _id: document2._id } } },
            ])
            expect(softDeleteDiiaIdByIdentityDocumentSpy).toHaveBeenCalledWith(userIdentifier, mobileUid, documentType)
        })

        it(`should set docStatus to ${DocStatus.NotFound} to all documents if no documents to update was passed`, async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { mobileUid } = headers
            const { user } = session
            const { identifier: userIdentifier } = user
            const documentType = DocumentType.InternationalVaccinationCertificate
            const ownerType = OwnerType.owner
            const document1 = {
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomUUID(),
                documentType,
                ownerType,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
                _id: randomUUID(),
                mobileUid,
            }
            const document2 = {
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomUUID(),
                documentType,
                ownerType,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
                _id: randomUUID(),
                mobileUid,
            }

            const userDocumentsFindSpy = userDocumentModelMock.find.mockResolvedValueOnce([document1, document2])
            const userDocumentsBulkWriteSpy = userDocumentModelMock.bulkWrite.mockResolvedValueOnce({})

            await userDocumentService.updateDocuments(userIdentifier, documentType, [], mobileUid, headers, false)

            expect(userDocumentsFindSpy).toHaveBeenCalledWith({ userIdentifier, documentType, mobileUid })
            expect(userDocumentsBulkWriteSpy).toHaveBeenCalledWith([
                { updateOne: { filter: { _id: document1._id }, update: { $set: { docStatus: DocStatus.NotFound } } } },
                { updateOne: { filter: { _id: document2._id }, update: { $set: { docStatus: DocStatus.NotFound } } } },
            ])
        })

        it(`should query stored ${DocumentType.InternationalVaccinationCertificate} documents by compoundDocument.documentIdentifier if passed documents has compoundDocument.documentIdentifier`, async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { mobileUid } = headers
            const { user } = session
            const { identifier: userIdentifier } = user
            const documentType = DocumentType.InternationalVaccinationCertificate
            const ownerType = OwnerType.owner
            const document1: UserProfileDocument = {
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomUUID(),
                documentSubType: UserDocumentSubtype.Vaccination,
                ownerType,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                compoundDocument: { documentIdentifier: randomUUID(), documentType },
            }
            const document2: UserProfileDocument = {
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomUUID(),
                documentSubType: UserDocumentSubtype.Vaccination,
                ownerType,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                compoundDocument: { documentIdentifier: randomUUID(), documentType },
            }

            const userDocumentsFindSpy = userDocumentModelMock.find.mockResolvedValueOnce([])

            userDocumentModelMock.bulkWrite.mockResolvedValueOnce({})

            await userDocumentService.updateDocuments(userIdentifier, documentType, [document1, document2], mobileUid, headers, true)

            expect(userDocumentsFindSpy).toHaveBeenCalledWith({
                userIdentifier,
                documentType,
                mobileUid,
                documentSubType: { $in: [UserDocumentSubtype.Vaccination] },
                'compoundDocument.documentIdentifier': {
                    $in: [document1!.compoundDocument!.documentIdentifier, document2!.compoundDocument!.documentIdentifier],
                },
            })
        })

        it(`should query stored ${DocumentType.InternationalVaccinationCertificate} documents if passed documents has no compoundDocument.documentIdentifier`, async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { mobileUid } = headers
            const { user } = session
            const { identifier: userIdentifier } = user
            const documentType = DocumentType.InternationalVaccinationCertificate
            const ownerType = OwnerType.owner
            const document1: UserProfileDocument = {
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomUUID(),
                documentSubType: UserDocumentSubtype.IssuedFirst,
                ownerType,
                registrationDate: new Date(Date.now() - DurationMs.Day),
            }
            const document2: UserProfileDocument = {
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomUUID(),
                documentSubType: UserDocumentSubtype.Permanent,
                ownerType,
                registrationDate: new Date(Date.now() - DurationMs.Day),
            }

            const userDocumentsFindSpy = userDocumentModelMock.find.mockResolvedValueOnce([])

            userDocumentModelMock.bulkWrite.mockResolvedValueOnce({})

            await userDocumentService.updateDocuments(userIdentifier, documentType, [document1, document2], mobileUid, headers, true)

            expect(userDocumentsFindSpy).toHaveBeenCalledWith({
                userIdentifier,
                documentType,
                mobileUid,
                documentSubType: { $in: [UserDocumentSubtype.IssuedFirst, UserDocumentSubtype.Permanent] },
                compoundDocument: { $exists: false },
            })
        })

        it('should update stored documents', async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { user } = session
            const { identifier: userIdentifier } = user
            const { mobileUid } = headers

            const documentType = DocumentType.VehicleLicense
            const initialDocument: UserProfileDocument = {
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomUUID(),
                ownerType: OwnerType.owner,
            }
            const updateDocumentModifier: Partial<UserProfileDocument> = {
                documentSubType: UserDocumentSubtype.IssuedFirst,
                normalizedDocumentIdentifier: randomUUID(),
                issueDate: new Date(Date.now() - DurationMs.Month),
                expirationDate: new Date(Date.now() + DurationMs.Day),
                registrationDate: new Date(Date.now() - DurationMs.Month),
                fullNameHash: randomUUID(),
            }

            const updateDocument: UserProfileDocument = { ...initialDocument, ...updateDocumentModifier }
            const {
                documentSubType,
                documentIdentifier,
                docId,
                docStatus,
                issueDate,
                expirationDate,
                registrationDate,
                fullNameHash,
                normalizedDocumentIdentifier,
            } = updateDocument

            const userDocumentsFindSpy = userDocumentModelMock.find.mockResolvedValueOnce([initialDocument])
            const userDocumentsBulkWriteSpy = userDocumentModelMock.bulkWrite.mockResolvedValueOnce({})

            await userDocumentService.updateDocuments(userIdentifier, documentType, [updateDocument], mobileUid, headers, false)

            expect(userDocumentsFindSpy).toHaveBeenCalledWith({ userIdentifier, documentType })
            expect(userDocumentsBulkWriteSpy).toHaveBeenCalledWith([
                {
                    updateMany: {
                        filter: { documentIdentifier, documentType },
                        update: {
                            $set: {
                                documentSubType,
                                docId,
                                docStatus,
                                issueDate,
                                expirationDate,
                                registrationDate,
                                fullNameHash,
                                normalizedDocumentIdentifier,
                            },
                        },
                    },
                },
            ])
        })

        it('should not perform any db operations if no document updates was detected', async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { mobileUid } = headers
            const { user } = session
            const { identifier: userIdentifier } = user
            const documentType = DocumentType.InternationalVaccinationCertificate

            const userDocumentsFindSpy = userDocumentModelMock.find.mockResolvedValueOnce([])
            const userDocumentsBulkWriteSpy = userDocumentModelMock.bulkWrite.mockResolvedValueOnce({})

            await userDocumentService.updateDocuments(userIdentifier, documentType, [], mobileUid, headers, false)

            expect(userDocumentsFindSpy).toHaveBeenCalledWith({ userIdentifier, documentType, mobileUid })
            expect(userDocumentsBulkWriteSpy).not.toHaveBeenCalled()
            expect(logger.debug).toHaveBeenCalledWith('There are no any user documents updates')
        })
    })

    describe(`method ${userDocumentService.getUserDocuments.name}`, () => {
        const { mobileUid } = testKit.session.getHeaders()
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()
        const documentType = DocumentType.BirthCertificate
        const documents = [
            {
                documentIdentifier: randomUUID(),
                documentType,
                ownerType: OwnerType.owner,
                userIdentifier,
            },
        ]

        it.each([
            [
                true,
                {
                    $or: [{ mobileUid: { $exists: false } }, { mobileUid }],
                    docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                    documentType,
                    userIdentifier,
                },
            ],
            [
                false,
                {
                    $or: [{ mobileUid: { $exists: false } }, { mobileUid }],
                    documentType,
                    userIdentifier,
                },
            ],
        ])('should successfully fetch and return user documents when activeOnly = %s', async (activeOnly, expectedQuery) => {
            userDocumentModelMock.find.mockResolvedValueOnce(documents)

            expect(await userDocumentService.getUserDocuments({ userIdentifier, documentType, mobileUid, activeOnly })).toEqual(documents)

            expect(userDocumentModelMock.find).toHaveBeenCalledWith(expectedQuery)
        })
    })

    describe(`method ${userDocumentService.getDocumentsByFilters.name}`, () => {
        it('should successfully fetch and return documents by filters', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const documentType = DocumentType.BirthCertificate
            const documents = [
                {
                    documentIdentifier: randomUUID(),
                    documentType,
                    ownerType: OwnerType.owner,
                    userIdentifier,
                },
            ]
            const filters = [
                {
                    documentType,
                    documentIdentifier: randomUUID(),
                    ownerType: OwnerType.owner,
                    docId: randomUUID(),
                },
                {
                    documentType,
                    documentIdentifier: randomUUID(),
                    ownerType: OwnerType.properUser,
                    docId: randomUUID(),
                    docStatus: [DocStatus.Ok],
                },
            ]

            userDocumentModelMock.find.mockResolvedValueOnce(documents)

            expect(await userDocumentService.getDocumentsByFilters(filters)).toEqual(documents)

            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                $or: [
                    {
                        docId: filters[0].docId,
                        docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                        documentIdentifier: filters[0].documentIdentifier,
                        documentType,
                        ownerType: filters[0].ownerType,
                    },
                    {
                        $or: [{ docStatus: { $exists: false } }, { docStatus: filters[1].docStatus }],
                        docId: filters[1].docId,
                        documentIdentifier: filters[1].documentIdentifier,
                        documentType,
                        ownerType: filters[1].ownerType,
                    },
                ],
            })
        })
    })

    describe(`method ${userDocumentService.getUserDocumentsByFilters.name}`, () => {
        it('should successfully fetch and return user documents by filters', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const documentType = DocumentType.BirthCertificate
            const documents = [
                {
                    documentIdentifier: randomUUID(),
                    documentType,
                    ownerType: OwnerType.owner,
                    userIdentifier,
                },
            ]
            const filters = [
                {
                    documentType,
                },
            ]

            userDocumentModelMock.find.mockReturnThis()
            userDocumentModelMock.lean.mockResolvedValueOnce(documents)

            expect(await userDocumentService.getUserDocumentsByFilters(userIdentifier, filters)).toEqual(documents)

            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                $or: [
                    {
                        docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                        documentType,
                    },
                ],
                userIdentifier,
            })
        })
    })

    describe(`method ${userDocumentService.addDocument.name}`, () => {
        it('should successfully add document', async () => {
            const docId = randomUUID()
            const docStatus = DocStatus.Ok
            const documentIdentifier = randomUUID()
            const documentType = DocumentType.InternationalVaccinationCertificate
            const ownerType = OwnerType.owner
            const headers = testKit.session.getHeaders()
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const { mobileUid } = headers

            const document: UserProfileDocument = {
                docId,
                docStatus,
                documentIdentifier,
                ownerType,
            }

            userDocumentModelMock.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })

            const result = await userDocumentService.addDocument(userIdentifier, documentType, document, mobileUid, headers)

            expect(result).toBeUndefined()

            expect(userDocumentModelMock.updateOne).toHaveBeenCalledWith(
                { userIdentifier, documentType, documentIdentifier, mobileUid },
                {
                    ownerType,
                    docId,
                    docStatus,
                },
                { upsert: true },
            )
            expect(analyticsService.log).toHaveBeenCalledWith(
                AnalyticsCategory.Users,
                userIdentifier,
                { documentType, documentId: documentIdentifier, ownerType },
                AnalyticsActionType.AddDocument,
                headers,
            )
        })
    })

    describe(`method ${userDocumentService.verifyUserDocuments.name}`, () => {
        it('should successfully verify user documents', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const documensToVerify = [
                {
                    documentType: DocumentType.BirthCertificate,
                    documentIdentifer: 'birth-certificate-identifier',
                },
                {
                    documentType: DocumentType.DriverLicense,
                    documentIdentifer: 'driver-license-identifier',
                },
            ]
            const documents = [
                {
                    documentType: DocumentType.BirthCertificate,
                    documentIdentifier: 'birth-certificate-identifier',
                    ownerType: OwnerType.owner,
                },
            ]

            userDocumentModelMock.find.mockResolvedValueOnce(documents)

            expect(await userDocumentService.verifyUserDocuments(userIdentifier, documensToVerify)).toEqual([
                {
                    documentType: DocumentType.BirthCertificate,
                    documentIdentifer: 'birth-certificate-identifier',
                    isOwner: true,
                },
                {
                    documentType: DocumentType.DriverLicense,
                    documentIdentifer: 'driver-license-identifier',
                    isOwner: false,
                },
            ])

            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                userIdentifier,
                $or: [
                    {
                        documentType: DocumentType.BirthCertificate,
                        docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                    },
                    {
                        documentType: DocumentType.DriverLicense,
                        docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                    },
                ],
            })
        })
    })

    describe(`method ${userDocumentService.getDocumentIdentifiers.name}`, () => {
        it('should successfully fetch and return documents identifiers', async () => {
            const documentType = DocumentType.BirthCertificate
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()

            userDocumentModelMock.find.mockResolvedValueOnce([
                {
                    documentType,
                    documentIdentifier: 'birth-certificate-identifier',
                    ownerType: OwnerType.owner,
                },
            ])
            userDocumentModelMock.find.mockResolvedValueOnce([])

            expect(await userDocumentService.getDocumentIdentifiers(userIdentifier, documentType)).toEqual(['birth-certificate-identifier'])
            expect(await userDocumentService.getDocumentIdentifiers(userIdentifier, documentType)).toEqual([])

            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                userIdentifier,
                documentType,
                docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
            })
        })
    })

    describe(`method ${userDocumentService.validateUserDocument.name}`, () => {
        it('should successfully validate user document', async () => {
            const documentType = DocumentType.BirthCertificate
            const documentIdentifier = 'birth-certificate-identifier'
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()

            userDocumentModelMock.findOne.mockResolvedValueOnce([
                {
                    documentType,
                    documentIdentifier,
                    ownerType: OwnerType.owner,
                },
            ])

            expect(await userDocumentService.validateUserDocument(userIdentifier, documentType, documentIdentifier)).toBeTruthy()

            expect(userDocumentModelMock.findOne).toHaveBeenCalledWith({
                userIdentifier,
                documentType,
                documentIdentifier,
                docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
            })
        })
    })

    describe(`method ${userDocumentService.identifyPenaltyOwner.name}`, () => {
        const documentType = DocumentType.VehicleLicense
        const vehicleLicenseIdentifier = randomUUID()
        const penaltyFixingDate = new Date()
        const expectedQuery = {
            documentType,
            docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
            $and: [
                {
                    $or: [
                        {
                            registrationDate: { $exists: false },
                        },
                        {
                            registrationDate: {
                                $exists: true,
                                $lt: penaltyFixingDate,
                            },
                        },
                    ],
                },
                {
                    $or: [
                        {
                            ownerType: { $ne: OwnerType.properUser },
                        },
                        {
                            expirationDate: { $exists: false },
                        },
                        {
                            ownerType: OwnerType.properUser,
                            expirationDate: {
                                $exists: true,
                                $gt: penaltyFixingDate,
                            },
                        },
                    ],
                },
                {
                    $or: [{ documentIdentifier: vehicleLicenseIdentifier }, { normalizedDocumentIdentifier: vehicleLicenseIdentifier }],
                },
            ],
        }

        it.each([
            [
                OwnerType.owner,
                [
                    {
                        documentType,
                        userIdentifier: 'owner-identifier',
                        ownerType: OwnerType.owner,
                    },
                ],
                'owner-identifier',
            ],
            [
                OwnerType.properUser,
                [
                    {
                        documentType,
                        userIdentifier: 'proper-user-identifier',
                        ownerType: OwnerType.properUser,
                    },
                ],
                'proper-user-identifier',
            ],
        ])('should successfully return penalty owner identifier when owner type %s', async (_ownerType, documents, expectedIdentifier) => {
            userDocumentModelMock.find.mockResolvedValueOnce(documents)

            expect(await userDocumentService.identifyPenaltyOwner(vehicleLicenseIdentifier, penaltyFixingDate)).toBe(expectedIdentifier)

            expect(userDocumentModelMock.find).toHaveBeenCalledWith(expectedQuery)
        })

        it('should fail with error in case document has unknown owner type', async () => {
            userDocumentModelMock.find.mockResolvedValueOnce([{ ownerType: 'unknown' }])

            await expect(async () => {
                await userDocumentService.identifyPenaltyOwner(vehicleLicenseIdentifier, penaltyFixingDate)
            }).rejects.toEqual(new TypeError('Unkown owner type: unknown'))

            expect(userDocumentModelMock.find).toHaveBeenCalledWith(expectedQuery)
        })
    })

    describe(`method ${userDocumentService.getUserDocumentTypes.name}`, () => {
        it('should successfully fetch and return user document types', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const expectedDocumentTypes = [DocumentType.InternalPassport, DocumentType.VehicleLicense, DocumentType.DriverLicense]

            userDocumentModelMock.aggregate.mockResolvedValueOnce([{ documentTypes: expectedDocumentTypes }])
            userDocumentModelMock.aggregate.mockResolvedValueOnce([])

            expect(await userDocumentService.getUserDocumentTypes(userIdentifier)).toEqual(expectedDocumentTypes)
            expect(await userDocumentService.getUserDocumentTypes(userIdentifier)).toEqual([])

            expect(userDocumentModelMock.aggregate).toHaveBeenCalledWith([
                {
                    $match: {
                        userIdentifier,
                        $or: [
                            {
                                docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                                documentType: { $nin: [] },
                            },
                        ],
                    },
                },
                {
                    $group: {
                        _id: null,
                        documentTypes: {
                            $addToSet: '$documentType',
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        documentTypes: 1,
                    },
                },
            ])
        })
    })

    describe(`method ${userDocumentService.getUserDocumentTypesCounts.name}`, () => {
        it('should successfully fetch and return user document types counts', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()

            userDocumentModelMock.aggregate.mockResolvedValueOnce([
                { _id: DocumentType.InternalPassport, count: 1 },
                { _id: DocumentType.BirthCertificate, count: 1 },
                { _id: DocumentType.VehicleLicense, count: 2 },
                { _id: DocumentType.DriverLicense, count: 1 },
            ])

            expect(await userDocumentService.getUserDocumentTypesCounts(userIdentifier)).toEqual({
                [DocumentType.InternalPassport]: 1,
                [DocumentType.BirthCertificate]: 1,
                [DocumentType.VehicleLicense]: 2,
                [DocumentType.DriverLicense]: 1,
            })

            expect(userDocumentModelMock.aggregate).toHaveBeenCalledWith([
                {
                    $match: {
                        userIdentifier,
                        $or: [
                            {
                                docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                                documentType: { $nin: [] },
                            },
                        ],
                    },
                },
                {
                    $group: {
                        _id: '$documentType',
                        count: { $sum: 1 },
                    },
                },
            ])
        })
    })

    describe(`method ${userDocumentService.hasDocuments.name}`, () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()
        const availableDocuments = [DocumentType.BirthCertificate, DocumentType.InternalPassport]

        it.each([
            [
                true,
                [[DocumentType.BirthCertificate], [DocumentType.InternalPassport]],
                {
                    $or: [
                        {
                            docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                            documentType: DocumentType.BirthCertificate,
                        },
                        {
                            docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                            documentType: DocumentType.InternalPassport,
                        },
                    ],
                },
            ],
            [
                false,
                [[DocumentType.DriverLicense], [DocumentType.PensionCard]],
                {
                    $or: [
                        {
                            docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                            documentType: DocumentType.DriverLicense,
                        },
                        {
                            docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                            documentType: DocumentType.PensionCard,
                        },
                    ],
                },
            ],
        ])('should return %s', async (expectedResult, documentTypes, query) => {
            userDocumentModelMock.distinct.mockResolvedValueOnce(availableDocuments)

            expect(await userDocumentService.hasDocuments(userIdentifier, documentTypes)).toBe(expectedResult)

            expect(userDocumentModelMock.distinct).toHaveBeenCalledWith('documentType', { userIdentifier, ...query })
        })
    })

    describe(`method ${userDocumentService.hasDocumentsByFilters.name}`, () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()
        const userDocuments = [
            { documentType: DocumentType.InternalPassport, ownerType: OwnerType.owner, docStatus: DocStatus.Ok },
            { documentType: DocumentType.DriverLicense, ownerType: OwnerType.owner, docStatus: DocStatus.Ok },
        ]

        it.each([
            [
                { hasDocuments: true, missingDocuments: [DocumentType.VehicleLicense] },
                [
                    {
                        $match: {
                            userIdentifier,
                            $or: [
                                {
                                    docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                                    documentType: DocumentType.InternalPassport,
                                },
                                {
                                    docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                                    documentType: DocumentType.VehicleLicense,
                                },
                                {
                                    docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                                    documentType: DocumentType.DriverLicense,
                                },
                            ],
                        },
                    },
                    { $group: { _id: { documentType: '$documentType', ownerType: '$ownerType', docStatus: '$docStatus' } } },
                    { $project: { documentType: '$_id.documentType', ownerType: '$_id.ownerType', docStatus: '$_id.docStatus', _id: 0 } },
                ],
                [
                    [{ documentType: DocumentType.InternalPassport, ownerType: OwnerType.owner, docStatus: [DocStatus.Ok] }],
                    [
                        { documentType: DocumentType.VehicleLicense, ownerType: OwnerType.owner, docStatus: [DocStatus.Ok] },
                        { documentType: DocumentType.DriverLicense, ownerType: OwnerType.owner, docStatus: [DocStatus.Ok] },
                    ],
                ],
            ],
            [
                { hasDocuments: false, missingDocuments: [DocumentType.VehicleLicense] },
                [
                    {
                        $match: {
                            userIdentifier,
                            $or: [
                                {
                                    docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                                    documentType: DocumentType.InternalPassport,
                                },
                                {
                                    docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                                    documentType: DocumentType.DriverLicense,
                                },
                                {
                                    docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                                    documentType: DocumentType.VehicleLicense,
                                },
                            ],
                        },
                    },
                    { $group: { _id: { documentType: '$documentType', ownerType: '$ownerType', docStatus: '$docStatus' } } },
                    { $project: { documentType: '$_id.documentType', ownerType: '$_id.ownerType', docStatus: '$_id.docStatus', _id: 0 } },
                ],
                [
                    [
                        { documentType: DocumentType.InternalPassport, ownerType: OwnerType.owner, docStatus: [DocStatus.Ok] },
                        { documentType: DocumentType.DriverLicense, ownerType: OwnerType.owner, docStatus: [DocStatus.Ok] },
                    ],
                    [{ documentType: DocumentType.VehicleLicense, ownerType: OwnerType.owner, docStatus: [DocStatus.Ok] }],
                ],
            ],
        ])(
            'should successfully define if user has some documents and which documents are missing and return result %s',
            async (expectedResult, expectedPipeline, filters) => {
                userDocumentModelMock.aggregate.mockResolvedValueOnce(userDocuments)

                expect(await userDocumentService.hasDocumentsByFilters(userIdentifier, filters)).toEqual(expectedResult)

                expect(userDocumentModelMock.aggregate).toHaveBeenCalledWith(expectedPipeline)
            },
        )
    })

    describe(`method ${userDocumentService.hasOneOfDocuments.name}`, () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()

        it.each([
            [
                true,
                1,
                [DocumentType.InternalPassport],
                {
                    userIdentifier,
                    $or: [
                        {
                            docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                            documentType: DocumentType.InternalPassport,
                        },
                    ],
                },
            ],
            [
                false,
                0,
                [DocumentType.VehicleLicense],
                {
                    userIdentifier,
                    $or: [
                        {
                            docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                            documentType: DocumentType.VehicleLicense,
                        },
                    ],
                },
            ],
        ])(
            'should define if user has one of documents and return %s',
            async (expectedResult, availableDocumentsAmount, documentTypes, expectedQuery) => {
                userDocumentModelMock.countDocuments.mockResolvedValueOnce(availableDocumentsAmount)

                expect(await userDocumentService.hasOneOfDocuments(userIdentifier, documentTypes)).toBe(expectedResult)

                expect(userDocumentModelMock.countDocuments).toHaveBeenCalledWith(expectedQuery)
            },
        )
    })

    describe(`method ${userDocumentService.removeDeviceDocuments.name}`, () => {
        it('should successfully remove user device documents', async () => {
            const { mobileUid } = testKit.session.getHeaders()
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const deletedCount = 5

            userDocumentModelMock.deleteMany.mockResolvedValueOnce({ deletedCount })

            expect(await userDocumentService.removeDeviceDocuments(userIdentifier, mobileUid)).toBeUndefined()

            expect(userDocumentModelMock.deleteMany).toHaveBeenCalledWith({ userIdentifier, mobileUid })
            expect(logger.debug).toHaveBeenCalledWith('Removed device documents result:', { deletedCount })
        })
    })

    describe(`method ${userDocumentService.removeUserDocuments.name}`, () => {
        it('should successfully remove user device documents', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const deletedCount = 5

            userDocumentModelMock.deleteMany.mockResolvedValueOnce({ deletedCount })

            expect(await userDocumentService.removeUserDocuments(userIdentifier)).toBeUndefined()

            expect(userDocumentModelMock.deleteMany).toHaveBeenCalledWith({ userIdentifier })
            expect(logger.debug).toHaveBeenCalledWith('Removed user documents result:', { deletedCount })
        })
    })

    describe(`method ${userDocumentService.removeUserDocumentById.name}`, () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()
        const documentType = DocumentType.LocalVaccinationCertificate
        const documentId = randomUUID()
        const headers = testKit.session.getHeaders()

        it('should successfully remove user document by id', async () => {
            const storedDocument = {
                documentType,
                ownerType: OwnerType.owner,
                documentIdentifier: randomUUID(),
            }
            const { documentIdentifier, ownerType } = storedDocument
            const { mobileUid } = headers

            userDocumentModelMock.findOneAndDelete.mockReturnValueOnce({ lean: () => storedDocument })
            jest.spyOn(diiaIdService, 'softDeleteDiiaIdByIdentityDocument').mockResolvedValueOnce()

            expect(
                await userDocumentService.removeUserDocumentById(userIdentifier, documentType, documentId, mobileUid, headers),
            ).toBeUndefined()

            expect(userDocumentModelMock.findOneAndDelete).toHaveBeenCalledWith({
                userIdentifier,
                documentType,
                docId: documentId,
                mobileUid,
            })
            expect(analyticsService.log).toHaveBeenCalledWith(
                AnalyticsCategory.Users,
                userIdentifier,
                { documentType, documentId: documentIdentifier, ownerType },
                AnalyticsActionType.RemoveDocument,
                headers,
            )
            expect(diiaIdService.softDeleteDiiaIdByIdentityDocument).toHaveBeenLastCalledWith(
                userIdentifier,
                headers.mobileUid,
                documentType,
            )
        })

        it('should just log and do nothing in case there is no stored user document', async () => {
            const { mobileUid } = headers

            userDocumentModelMock.findOneAndDelete.mockReturnValueOnce({ lean: () => null })

            expect(
                await userDocumentService.removeUserDocumentById(userIdentifier, documentType, documentId, mobileUid, headers),
            ).toBeUndefined()

            expect(userDocumentModelMock.findOneAndDelete).toHaveBeenCalledWith({
                userIdentifier,
                documentType,
                docId: documentId,
                mobileUid,
            })
            expect(logger.info).toHaveBeenCalledWith('No user document to remove', { documentType, docId: documentId })
        })
    })

    describe(`method ${userDocumentService.checkInternationalVaccinationCertificatesExpirations.name}`, () => {
        it('should successfully check international vaccination certificates expirations', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const { mobileUid } = testKit.session.getHeaders()
            const readyToExpireDocuments = [
                {
                    _id: randomUUID(),
                    userIdentifier,
                    mobileUid,
                    compoundDocument: { documentIdentifier: randomUUID(), documentType: DocumentType.InternationalVaccinationCertificate },
                },
                {
                    _id: randomUUID(),
                    userIdentifier,
                    mobileUid,
                },
            ]

            momentStubs.moment.mockReturnValueOnce({ add: momentStubs.add }).mockReturnValueOnce({ add: momentStubs.add })
            momentStubs.add.mockReturnValueOnce({ toDate: momentStubs.toDate }).mockReturnValueOnce({ toDate: momentStubs.toDate })
            momentStubs.toDate.mockReturnValueOnce(now).mockReturnValueOnce(now)
            userDocumentModelMock.find.mockResolvedValueOnce(readyToExpireDocuments)
            jest.spyOn(notificationService, 'createNotificationWithPushesByMobileUidSafe').mockResolvedValueOnce().mockResolvedValueOnce()
            userDocumentModelMock.bulkWrite.mockResolvedValueOnce(null)

            expect(await userDocumentService.checkInternationalVaccinationCertificatesExpirations()).toBeUndefined()

            expect(momentStubs.moment).toHaveBeenCalledWith()
            expect(momentStubs.add).toHaveBeenCalledWith(23, 'hours')
            expect(momentStubs.add).toHaveBeenCalledWith(24, 'hours')
            expect(momentStubs.toDate).toHaveBeenCalledWith()
            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                documentType: DocumentType.InternationalVaccinationCertificate,
                expirationDate: {
                    $gt: now,
                    $lte: now,
                },
                [`notifications.${MessageTemplateCode.CovidCertificateWillExpire}`]: { $exists: false },
                [`notifications.${MessageTemplateCode.ChildCovidCertificateWillExpire}`]: { $exists: false },
            })
            expect(logger.debug).toHaveBeenCalledWith(`Got [${readyToExpireDocuments.length}] certificates close to expiration date`)
            expect(notificationService.createNotificationWithPushesByMobileUidSafe).toHaveBeenCalledWith({
                templateCode: MessageTemplateCode.ChildCovidCertificateWillExpire,
                userIdentifier,
                mobileUid,
            })
            expect(notificationService.createNotificationWithPushesByMobileUidSafe).toHaveBeenCalledWith({
                templateCode: MessageTemplateCode.CovidCertificateWillExpire,
                userIdentifier,
                mobileUid,
            })
            expect(userDocumentModelMock.bulkWrite).toHaveBeenCalledWith([
                {
                    updateOne: {
                        filter: { _id: readyToExpireDocuments[0]._id },
                        update: { $set: { [`notifications.${MessageTemplateCode.ChildCovidCertificateWillExpire}`]: now } },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: readyToExpireDocuments[1]._id },
                        update: { $set: { [`notifications.${MessageTemplateCode.CovidCertificateWillExpire}`]: now } },
                    },
                },
            ])
        })
    })

    describe(`method ${userDocumentService.checkDriverLicensesExpirations.name}`, () => {
        it('should successfully check driver licenses expirations', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const lastDayDriverLicenses = [{ _id: randomUUID(), userIdentifier }]
            const fewDaysDriverLicenses = [{ _id: randomUUID(), userIdentifier }]

            momentStubs.moment
                .mockReturnValueOnce({ startOf: momentStubs.startOf })
                .mockReturnValueOnce({ endOf: momentStubs.endOf })
                .mockReturnValueOnce({ add: momentStubs.add })
                .mockReturnValueOnce({ add: momentStubs.add })
            momentStubs.startOf.mockReturnValueOnce({ toDate: momentStubs.toDate }).mockReturnValueOnce({ toDate: momentStubs.toDate })
            momentStubs.endOf.mockReturnValueOnce({ toDate: momentStubs.toDate }).mockReturnValueOnce({ toDate: momentStubs.toDate })
            momentStubs.add.mockReturnValueOnce({ startOf: momentStubs.startOf }).mockReturnValueOnce({ endOf: momentStubs.endOf })
            momentStubs.toDate.mockReturnValueOnce(now).mockReturnValueOnce(now).mockReturnValueOnce(now).mockReturnValueOnce(now)
            userDocumentModelMock.find.mockResolvedValueOnce(lastDayDriverLicenses).mockResolvedValueOnce(fewDaysDriverLicenses)
            jest.spyOn(notificationService, 'createNotificationWithPushesSafe').mockResolvedValueOnce().mockResolvedValueOnce()
            userDocumentModelMock.bulkWrite.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

            expect(await userDocumentService.checkDriverLicensesExpirations()).toBeUndefined()

            expect(momentStubs.moment).toHaveBeenCalledWith()
            expect(momentStubs.startOf).toHaveBeenCalledWith('day')
            expect(momentStubs.endOf).toHaveBeenCalledWith('day')
            expect(momentStubs.add).toHaveBeenCalledWith(10, 'days')
            expect(momentStubs.toDate).toHaveBeenCalledWith()
            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                documentType: DocumentType.DriverLicense,
                documentSubType: UserDocumentSubtype.IssuedFirst,
                expirationDate: {
                    $gte: now,
                    $lte: now,
                },
                [`notifications.${MessageTemplateCode.DriverLicenseExpirationLastDay}`]: { $exists: false },
            })
            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                documentType: DocumentType.DriverLicense,
                documentSubType: UserDocumentSubtype.IssuedFirst,
                expirationDate: {
                    $gte: now,
                    $lte: now,
                },
                [`notifications.${MessageTemplateCode.DriverLicenseExpiresInFewDays}`]: { $exists: false },
            })
            expect(logger.info).toHaveBeenCalledWith(
                `Got [${lastDayDriverLicenses.length}] driver licenses to send notification [${MessageTemplateCode.DriverLicenseExpirationLastDay}]`,
            )
            expect(logger.info).toHaveBeenCalledWith(
                `Got [${fewDaysDriverLicenses.length}] driver licenses to send notification [${MessageTemplateCode.DriverLicenseExpiresInFewDays}]`,
            )
            expect(notificationService.createNotificationWithPushesSafe).toHaveBeenCalledWith({
                templateCode: MessageTemplateCode.DriverLicenseExpirationLastDay,
                userIdentifier,
            })
            expect(notificationService.createNotificationWithPushesSafe).toHaveBeenCalledWith({
                templateCode: MessageTemplateCode.DriverLicenseExpiresInFewDays,
                userIdentifier,
            })
            expect(userDocumentModelMock.bulkWrite).toHaveBeenCalledWith([
                {
                    updateOne: {
                        filter: { _id: lastDayDriverLicenses[0]._id },
                        update: { $set: { [`notifications.${MessageTemplateCode.DriverLicenseExpirationLastDay}`]: now } },
                    },
                },
            ])
            expect(userDocumentModelMock.bulkWrite).toHaveBeenCalledWith([
                {
                    updateOne: {
                        filter: { _id: fewDaysDriverLicenses[0]._id },
                        update: { $set: { [`notifications.${MessageTemplateCode.DriverLicenseExpiresInFewDays}`]: now } },
                    },
                },
            ])
        })
    })

    describe(`method ${userDocumentService.checkVehicleLicensesExpirations.name}`, () => {
        it('should successfully check vehicle licenses expirations', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const vehicleLicensesExpirationLastDay = [
                {
                    _id: randomUUID(),
                    userIdentifier,
                    documentIdentifier: randomUUID(),
                    documentData: { brand: 'mazda', model: 'cx-5', licensePlate: 'KA1111KA' },
                },
            ]
            const vehicleLicensesExpiresInFewDays = [
                {
                    _id: randomUUID(),
                    userIdentifier,
                    documentIdentifier: randomUUID(),
                },
            ]
            const ownerUserDocument = { _id: randomUUID(), userIdentifier }

            momentStubs.moment
                .mockReturnValueOnce({ startOf: momentStubs.startOf })
                .mockReturnValueOnce({ endOf: momentStubs.endOf })
                .mockReturnValueOnce({ add: momentStubs.add })
                .mockReturnValueOnce({ add: momentStubs.add })
            momentStubs.startOf.mockReturnValueOnce({ toDate: momentStubs.toDate }).mockReturnValueOnce({ toDate: momentStubs.toDate })
            momentStubs.endOf.mockReturnValueOnce({ toDate: momentStubs.toDate }).mockReturnValueOnce({ toDate: momentStubs.toDate })
            momentStubs.add.mockReturnValueOnce({ startOf: momentStubs.startOf }).mockReturnValueOnce({ endOf: momentStubs.endOf })
            momentStubs.toDate.mockReturnValueOnce(now).mockReturnValueOnce(now).mockReturnValueOnce(now).mockReturnValueOnce(now)
            userDocumentModelMock.find
                .mockResolvedValueOnce(vehicleLicensesExpirationLastDay)
                .mockResolvedValueOnce(vehicleLicensesExpiresInFewDays)
            jest.spyOn(notificationService, 'createNotificationWithPushesSafe')
                .mockResolvedValueOnce()
                .mockResolvedValueOnce()
                .mockResolvedValueOnce()
                .mockResolvedValueOnce()
            userDocumentModelMock.findOne.mockResolvedValueOnce(ownerUserDocument).mockResolvedValueOnce(ownerUserDocument)
            userDocumentModelMock.bulkWrite.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

            expect(await userDocumentService.checkVehicleLicensesExpirations()).toBeUndefined()

            expect(momentStubs.moment).toHaveBeenCalledWith()
            expect(momentStubs.startOf).toHaveBeenCalledWith('day')
            expect(momentStubs.endOf).toHaveBeenCalledWith('day')
            expect(momentStubs.add).toHaveBeenCalledWith(10, 'days')
            expect(momentStubs.toDate).toHaveBeenCalledWith()
            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                documentType: DocumentType.VehicleLicense,
                ownerType: OwnerType.properUser,
                expirationDate: {
                    $gte: now,
                    $lte: now,
                },
                [`notifications.${MessageTemplateCode.VehicleLicenseExpirationLastDayToProperUser}`]: { $exists: false },
            })
            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                documentType: DocumentType.VehicleLicense,
                ownerType: OwnerType.properUser,
                expirationDate: {
                    $gte: now,
                    $lte: now,
                },
                [`notifications.${MessageTemplateCode.VehicleLicenseExpiresInFewDaysToProperUser}`]: { $exists: false },
            })
            expect(logger.info).toHaveBeenCalledWith(
                `Got [${vehicleLicensesExpirationLastDay.length}] vehicle licenses to send notification [${MessageTemplateCode.VehicleLicenseExpirationLastDayToProperUser}, ${MessageTemplateCode.VehicleLicenseExpirationLastDayToOwner}]`,
            )
            expect(logger.info).toHaveBeenCalledWith(
                `Got [${vehicleLicensesExpiresInFewDays.length}] vehicle licenses to send notification [${MessageTemplateCode.VehicleLicenseExpiresInFewDaysToProperUser}, ${MessageTemplateCode.VehicleLicenseExpiresInFewDaysToOwner}]`,
            )
            expect(notificationService.createNotificationWithPushesSafe).toHaveBeenCalledWith({
                templateCode: MessageTemplateCode.VehicleLicenseExpirationLastDayToProperUser,
                userIdentifier,
                templateParams: {
                    [TemplateStub.BrandModel]: 'mazda cx-5',
                    [TemplateStub.LicensePlate]: 'KA1111KA',
                },
            })
            expect(notificationService.createNotificationWithPushesSafe).toHaveBeenCalledWith({
                templateCode: MessageTemplateCode.VehicleLicenseExpiresInFewDaysToProperUser,
                userIdentifier,
                templateParams: {
                    [TemplateStub.BrandModel]: '',
                    [TemplateStub.LicensePlate]: undefined,
                },
            })
            expect(userDocumentModelMock.findOne).toHaveBeenCalledWith({
                documentIdentifier: vehicleLicensesExpirationLastDay[0].documentIdentifier,
            })
            expect(userDocumentModelMock.findOne).toHaveBeenCalledWith({
                documentIdentifier: vehicleLicensesExpiresInFewDays[0].documentIdentifier,
            })
            expect(userDocumentModelMock.bulkWrite).toHaveBeenCalledWith([
                {
                    updateOne: {
                        filter: { _id: vehicleLicensesExpirationLastDay[0]._id },
                        update: {
                            $set: { [`notifications.${MessageTemplateCode.VehicleLicenseExpirationLastDayToProperUser}`]: new Date() },
                        },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: ownerUserDocument._id },
                        update: { $set: { [`notifications.${MessageTemplateCode.VehicleLicenseExpirationLastDayToOwner}`]: new Date() } },
                    },
                },
            ])
            expect(userDocumentModelMock.bulkWrite).toHaveBeenCalledWith([
                {
                    updateOne: {
                        filter: { _id: vehicleLicensesExpiresInFewDays[0]._id },
                        update: {
                            $set: { [`notifications.${MessageTemplateCode.VehicleLicenseExpiresInFewDaysToProperUser}`]: new Date() },
                        },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: ownerUserDocument._id },
                        update: { $set: { [`notifications.${MessageTemplateCode.VehicleLicenseExpiresInFewDaysToOwner}`]: new Date() } },
                    },
                },
            ])
        })
    })

    describe(`method ${userDocumentService.processUserDocuments.name}`, () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()

        it('should successfully process user documents', async () => {
            const documentsToProcess = [DocumentType.InternalPassport, DocumentType.ForeignPassport]
            const userDocuments = [
                {
                    documentIdentifier: randomUUID(),
                    documentType: DocumentType.InternalPassport,
                    ownerType: OwnerType.owner,
                    userIdentifier,
                    comparedTo: {
                        documentType: DocumentType.ForeignPassport,
                        fullNameHash: 'full-name-hash-other',
                    },
                    docId: randomUUID(),
                    docStatus: DocStatus.Ok,
                    fullNameHash: 'full-name-hash',
                },
                {
                    documentIdentifier: randomUUID(),
                    documentType: DocumentType.DriverLicense,
                    ownerType: OwnerType.owner,
                    userIdentifier,
                    comparedTo: {
                        documentType: DocumentType.InternalPassport,
                        fullNameHash: 'full-name-hash-other',
                    },
                    docId: randomUUID(),
                    docStatus: DocStatus.Ok,
                    fullNameHash: 'driver-license-full-name-hash',
                },
            ]

            userDocumentModelMock.find.mockReturnValueOnce({ sort: userDocumentModelMock.sort })
            userDocumentModelMock.sort.mockResolvedValueOnce(userDocuments)
            jest.spyOn(notificationService, 'createNotificationWithPushesSafe').mockResolvedValueOnce()
            userDocumentModelMock.bulkWrite.mockResolvedValueOnce(<BulkWriteResult>{})

            expect(await userDocumentService.processUserDocuments(userIdentifier, documentsToProcess)).toEqual([
                [DocumentType.DriverLicense, DocumentType.InternalPassport],
            ])

            expect(userDocumentModelMock.find).toHaveBeenCalledWith({
                userIdentifier,
                $or: [
                    {
                        docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                        documentType: DocumentType.DriverLicense,
                    },
                    {
                        docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                        documentType: DocumentType.InternalPassport,
                    },
                    {
                        docStatus: { $nin: [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound] },
                        documentType: DocumentType.ForeignPassport,
                    },
                ],
            })
            expect(userDocumentModelMock.sort).toHaveBeenCalledWith({ _id: -1 })
            expect(notificationService.createNotificationWithPushesSafe).toHaveBeenCalledWith({
                templateCode: MessageTemplateCode.DriverLicenseDataChanged,
                userIdentifier,
            })
            expect(userDocumentModelMock.bulkWrite).toHaveBeenCalledWith([
                {
                    updateOne: {
                        filter: {
                            userIdentifier,
                            documentType: userDocuments[1].documentType,
                            documentIdentifier: userDocuments[1].documentIdentifier,
                        },
                        update: {
                            $set: {
                                comparedTo: { documentType: userDocuments[0].documentType, fullNameHash: userDocuments[0].fullNameHash },
                            },
                        },
                    },
                },
            ])
            expect(logger.info).toHaveBeenCalledWith('Process user documents bulk write result', {})
        })

        it.each([
            ['there are no processable document types', [DocumentType.BirthCertificate], [], (): void => {}],
            [
                'there are no such doc with type to compare',
                [DocumentType.InternalPassport, DocumentType.ForeignPassport],
                [],
                (): void => {
                    userDocumentModelMock.find.mockReturnValueOnce({ sort: userDocumentModelMock.sort })
                    userDocumentModelMock.sort.mockResolvedValueOnce([])
                },
            ],
            [
                'document to compare has no full name hash',
                [DocumentType.InternalPassport, DocumentType.ForeignPassport],
                [[DocumentType.DriverLicense, DocumentType.InternalPassport]],
                (): void => {
                    userDocumentModelMock.find.mockReturnValueOnce({ sort: userDocumentModelMock.sort })
                    userDocumentModelMock.sort.mockResolvedValueOnce([
                        {
                            documentIdentifier: randomUUID(),
                            documentType: DocumentType.InternalPassport,
                            ownerType: OwnerType.owner,
                            userIdentifier,
                        },
                        {
                            documentIdentifier: randomUUID(),
                            documentType: DocumentType.DriverLicense,
                            ownerType: OwnerType.owner,
                            userIdentifier,
                        },
                    ])
                },
            ],
            [
                'source document to compare has no full name hash',
                [DocumentType.InternalPassport, DocumentType.ForeignPassport],
                [[DocumentType.DriverLicense, DocumentType.InternalPassport]],
                (): void => {
                    userDocumentModelMock.find.mockReturnValueOnce({ sort: userDocumentModelMock.sort })
                    userDocumentModelMock.sort.mockResolvedValueOnce([
                        {
                            documentIdentifier: randomUUID(),
                            documentType: DocumentType.InternalPassport,
                            ownerType: OwnerType.owner,
                            userIdentifier,
                            fullNameHash: 'full-name-hash',
                        },
                        {
                            documentIdentifier: randomUUID(),
                            documentType: DocumentType.DriverLicense,
                            ownerType: OwnerType.owner,
                            userIdentifier,
                        },
                    ])
                },
            ],
        ])('should skip processing in case %s', async (_msg, documentTypesToProcess, expectedResult, defineStubs) => {
            defineStubs()

            expect(await userDocumentService.processUserDocuments(userIdentifier, documentTypesToProcess)).toEqual(expectedResult)
        })
    })
})
