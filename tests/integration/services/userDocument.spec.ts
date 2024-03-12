import { randomUUID } from 'crypto'

import { IdentifierService } from '@diia-inhouse/crypto'
import TestKit from '@diia-inhouse/test'
import { DocStatus, DocumentType, DurationMs, OwnerType, UserDocumentSubtype } from '@diia-inhouse/types'

import UserDocumentService from '@services/userDocument'

import userDocumentModel from '@models/userDocument'

import { RandomData } from '@mocks/randomData'

import { getApp } from '@tests/utils/getApp'

import { UserDocument } from '@interfaces/models/userDocument'
import { UserDocumentData, UserProfileDocument } from '@interfaces/services/documents'

describe(`Service ${UserDocumentService.name}`, () => {
    const testKit = new TestKit()
    const identifier = new IdentifierService({ salt: 'salt' })
    const randomData = new RandomData(identifier)

    let app: Awaited<ReturnType<typeof getApp>>
    let userDocumentService: UserDocumentService

    beforeAll(async () => {
        app = await getApp()

        userDocumentService = app.container.build(UserDocumentService)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    describe('Method hasOneOfDocuments', () => {
        const { session, headers } = testKit.session.getUserActionArguments()
        const { mobileUid } = headers
        const { user } = session
        const { identifier: userIdentifier } = user

        afterEach(async () => {
            await userDocumentService.removeUserDocuments(userIdentifier)
        })

        it('should return true if has one of documents', async () => {
            const document: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }

            await Promise.all([
                userDocumentService.addDocument(userIdentifier, DocumentType.InternalPassport, document, mobileUid, headers),
            ])

            const hasOneOfDocuemnts = await userDocumentService.hasOneOfDocuments(userIdentifier, [
                DocumentType.InternalPassport,
                DocumentType.ForeignPassport,
            ])

            expect(hasOneOfDocuemnts).toBe(true)
        })

        it("should return false if hasn't any of documents", async () => {
            const document: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.NotFound,
            }

            await Promise.all([
                userDocumentService.addDocument(userIdentifier, DocumentType.InternalPassport, document, mobileUid, headers),
            ])

            const hasOneOfDocuemnts = await userDocumentService.hasOneOfDocuments(userIdentifier, [
                DocumentType.InternalPassport,
                DocumentType.ForeignPassport,
            ])

            expect(hasOneOfDocuemnts).toBe(false)
        })
    })

    describe('Method identifyPenaltyOwner', () => {
        const { session } = testKit.session.getUserActionArguments()
        const { user } = session
        const { identifier: userIdentifier } = user

        afterEach(async () => {
            await userDocumentService.removeUserDocuments(userIdentifier)
        })

        it('should return proper user identifier if proper not expired', async () => {
            const yesterday = new Date(Date.now() - DurationMs.Day)
            const tomorrow = new Date(Date.now() + DurationMs.Day)
            const penaltyFixingAt = new Date()

            const properUserId = randomData.generateUserIdentifier()

            const sharedVehicleIdentifier = randomData.generateDocumentIdentifier()

            const ownerDocs: UserDocument[] = [
                {
                    userIdentifier,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: sharedVehicleIdentifier,
                    ownerType: OwnerType.owner,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    notifications: {},
                },
            ]

            const properUserDocs: UserDocument[] = [
                {
                    userIdentifier: properUserId,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    ownerType: OwnerType.owner,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    notifications: {},
                },
                {
                    userIdentifier: properUserId,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: sharedVehicleIdentifier,
                    ownerType: OwnerType.properUser,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    expirationDate: tomorrow,
                    notifications: {},
                },
            ]

            await userDocumentModel.insertMany([...ownerDocs, ...properUserDocs])

            const assignedUserId = await userDocumentService.identifyPenaltyOwner(sharedVehicleIdentifier, penaltyFixingAt)

            expect(assignedUserId).toBe(properUserId)
        })

        it('should return owner identifier if proper expiration expired', async () => {
            const yesterday = new Date(Date.now() - DurationMs.Day)
            const penaltyFixingAt = new Date()

            const properUserId = randomData.generateUserIdentifier()

            const sharedVehicleIdentifier = randomData.generateDocumentIdentifier()

            const ownerDocs: UserDocument[] = [
                {
                    userIdentifier,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: sharedVehicleIdentifier,
                    ownerType: OwnerType.owner,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    notifications: {},
                },
            ]

            const properUserDocs: UserDocument[] = [
                {
                    userIdentifier: properUserId,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    ownerType: OwnerType.owner,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    notifications: {},
                },
                {
                    userIdentifier: properUserId,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: sharedVehicleIdentifier,
                    ownerType: OwnerType.properUser,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    expirationDate: yesterday,
                    notifications: {},
                },
            ]

            await userDocumentModel.insertMany([...ownerDocs, ...properUserDocs])

            const assignedUserId = await userDocumentService.identifyPenaltyOwner(sharedVehicleIdentifier, penaltyFixingAt)

            expect(assignedUserId).toBe(userIdentifier)
        })

        it('should return proper user identifier if proper expiration not exist', async () => {
            const yesterday = new Date(Date.now() - DurationMs.Day)
            const penaltyFixingAt = new Date()

            const properUserId = randomData.generateUserIdentifier()

            const sharedVehicleIdentifier = randomData.generateDocumentIdentifier()

            const ownerDocs: UserDocument[] = [
                {
                    userIdentifier,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: sharedVehicleIdentifier,
                    ownerType: OwnerType.owner,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    notifications: {},
                },
            ]

            const properUserDocs: UserDocument[] = [
                {
                    userIdentifier: properUserId,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    ownerType: OwnerType.owner,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    notifications: {},
                },
                {
                    userIdentifier: properUserId,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: sharedVehicleIdentifier,
                    ownerType: OwnerType.properUser,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    notifications: {},
                },
            ]

            await userDocumentModel.insertMany([...ownerDocs, ...properUserDocs])

            const assignedUserId = await userDocumentService.identifyPenaltyOwner(sharedVehicleIdentifier, penaltyFixingAt)

            expect(assignedUserId).toBe(properUserId)
        })

        it('should return owner identifier if proper not exist', async () => {
            const yesterday = new Date(Date.now() - DurationMs.Day)
            const penaltyFixingAt = new Date()

            const properUserId = randomData.generateUserIdentifier()

            const sharedVehicleIdentifier = randomData.generateDocumentIdentifier()

            const ownerDocs: UserDocument[] = [
                {
                    userIdentifier,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: sharedVehicleIdentifier,
                    ownerType: OwnerType.owner,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    notifications: {},
                },
            ]

            const properUserDocs: UserDocument[] = [
                {
                    userIdentifier: properUserId,
                    documentType: DocumentType.VehicleLicense,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    ownerType: OwnerType.owner,
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    registrationDate: yesterday,
                    notifications: {},
                },
            ]

            await userDocumentModel.insertMany([...ownerDocs, ...properUserDocs])

            const assignedUserId = await userDocumentService.identifyPenaltyOwner(sharedVehicleIdentifier, penaltyFixingAt)

            expect(assignedUserId).toBe(userIdentifier)
        })
    })

    describe('Method updateDocuments', () => {
        const { session, headers } = testKit.session.getUserActionArguments()
        const { mobileUid } = headers
        const { user } = session
        const { identifier: userIdentifier } = user

        afterEach(async () => {
            await userDocumentService.removeUserDocuments(userIdentifier)
        })

        it('should add new document if it does not exist', async () => {
            const documentType = DocumentType.DriverLicense
            const document = {
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomData.generateDocumentIdentifier(),
                documentType,
                ownerType: OwnerType.owner,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
            }

            await userDocumentService.updateDocuments(userIdentifier, documentType, [document], mobileUid, headers, false)

            const result = await userDocumentService.getUserDocuments({ userIdentifier, documentType, mobileUid })

            expect(result).toEqual([expect.objectContaining(document)])
        })

        it('should add new device-related document if it does not exist', async () => {
            const documentType = DocumentType.MilitaryBond
            const document = {
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomData.generateDocumentIdentifier(),
                documentType,
                ownerType: OwnerType.owner,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
            }

            await userDocumentService.updateDocuments(userIdentifier, documentType, [document], mobileUid, headers, false)

            const result = await userDocumentService.getUserDocuments({ userIdentifier, documentType, mobileUid })

            expect(result).toEqual([expect.objectContaining({ ...document, mobileUid })])
        })

        it.each([
            [
                'should set registration date of vehicle license if it does not have one',
                {
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    documentType: DocumentType.VehicleLicense,
                    ownerType: OwnerType.owner,
                    userIdentifier,
                },
                { registrationDate: new Date(Date.now() - DurationMs.Day) },
                ({ registrationDate }: Partial<UserDocument>): Partial<UserDocument> => ({ registrationDate }),
            ],
            [
                'should set expiration date of vehicle license if it has proper user owner type',
                {
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    documentType: DocumentType.VehicleLicense,
                    ownerType: OwnerType.owner,
                    userIdentifier,
                },
                { expirationDate: new Date(Date.now() + DurationMs.Day * 365), ownerType: OwnerType.properUser },
                ({ expirationDate }: Partial<UserDocument>): Partial<UserDocument> => ({ expirationDate }),
            ],
            [
                'should update driver license if it does not have expiration date and subtype',
                {
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    documentType: DocumentType.DriverLicense,
                    ownerType: OwnerType.owner,
                    registrationDate: new Date(Date.now() - DurationMs.Day),
                    userIdentifier,
                },
                { documentSubType: UserDocumentSubtype.Permanent, expirationDate: new Date(Date.now() + DurationMs.Day * 1000) },
                ({ expirationDate }: Partial<UserDocument>): Partial<UserDocument> => ({
                    documentSubType: UserDocumentSubtype.Permanent,
                    expirationDate,
                }),
            ],
            [
                'should set normalizedDocumentIdentifier if not exists',
                {
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    documentType: DocumentType.VehicleLicense,
                    ownerType: OwnerType.owner,
                    registrationDate: new Date(Date.now() - DurationMs.Day),
                    userIdentifier,
                },
                { normalizedDocumentIdentifier: randomUUID() },
                ({ normalizedDocumentIdentifier }: Partial<UserDocument>): Partial<UserDocument> => ({ normalizedDocumentIdentifier }),
            ],
            [
                'should set documentData',
                {
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    documentType: DocumentType.VehicleLicense,
                    ownerType: OwnerType.owner,
                    registrationDate: new Date(Date.now() - DurationMs.Day),
                    userIdentifier,
                },
                { documentData: <UserDocumentData>{ brand: 'Volkswagen', model: 'Golf', licensePlate: 'AX7890XC' } },
                (): Partial<UserDocument> => ({
                    documentData: <UserDocumentData>{ brand: 'Volkswagen', model: 'Golf', licensePlate: 'AX7890XC' },
                }),
            ],
            [
                `should set documentSubType for ${DocumentType.StudentIdCard}`,
                {
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    documentType: DocumentType.StudentIdCard,
                    ownerType: OwnerType.owner,
                    registrationDate: new Date(Date.now() - DurationMs.Day),
                    userIdentifier,
                },
                { documentSubType: UserDocumentSubtype.Student },
                (): Partial<UserDocument> => ({ documentSubType: UserDocumentSubtype.Student }),
            ],
            [
                `should overwrite docId, docStatus and fullNameHash`,
                {
                    docId: randomData.generateDocId(),
                    docStatus: DocStatus.Ok,
                    documentIdentifier: randomData.generateDocumentIdentifier(),
                    documentType: DocumentType.BirthCertificate,
                    ownerType: OwnerType.owner,
                    registrationDate: new Date(Date.now() - DurationMs.Day),
                    userIdentifier,
                },
                { docId: 'new-doc-id', docStatus: DocStatus.Updating, fullNameHash: 'full-name-hash' },
                (): Partial<UserDocument> => ({ docId: 'new-doc-id', docStatus: DocStatus.Updating, fullNameHash: 'full-name-hash' }),
            ],
        ])('%s', async (_msg, initialDocument, updateDocumentModifier, getExpectedDocumentModifier) => {
            const { documentType } = initialDocument
            const updateDocument = { ...initialDocument, ...updateDocumentModifier }
            const expectedDocument = { ...initialDocument, ...getExpectedDocumentModifier(updateDocument) }

            await userDocumentService.updateDocuments(userIdentifier, documentType, [initialDocument], mobileUid, headers, false)
            await userDocumentService.updateDocuments(userIdentifier, documentType, [updateDocument], mobileUid, headers, false)

            const result = await userDocumentService.getUserDocuments({ userIdentifier, documentType, mobileUid })

            expect(result).toEqual([expect.objectContaining(expectedDocument)])
        })

        it('should remove documents if they are missing in request', async () => {
            const documentType = DocumentType.DriverLicense
            const document1 = {
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomData.generateDocumentIdentifier(),
                documentType,
                ownerType: OwnerType.owner,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
            }
            const document2 = {
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomData.generateDocumentIdentifier(),
                documentType,
                ownerType: OwnerType.owner,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
            }
            const document3 = {
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomData.generateDocumentIdentifier(),
                documentType,
                ownerType: OwnerType.owner,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
            }
            const updatedDocument2 = {
                ...document2,
                normalizedDocumentIdentifier: randomUUID(),
            }

            await userDocumentService.updateDocuments(
                userIdentifier,
                documentType,
                [document1, document2, document3],
                mobileUid,
                headers,
                true,
            )
            await userDocumentService.updateDocuments(userIdentifier, documentType, [updatedDocument2], mobileUid, headers, true)

            const result = await userDocumentService.getUserDocuments({ userIdentifier, documentType, mobileUid, activeOnly: false })

            expect(result).toEqual([expect.objectContaining(updatedDocument2)])
        })

        it(`should set doc status ${DocStatus.NotFound} for documents that are not present in request`, async () => {
            const documentType = DocumentType.DriverLicense
            const document1 = {
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomData.generateDocumentIdentifier(),
                documentType,
                ownerType: OwnerType.owner,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
            }
            const document2 = {
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomData.generateDocumentIdentifier(),
                documentType,
                ownerType: OwnerType.owner,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
            }
            const document3 = {
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
                documentIdentifier: randomData.generateDocumentIdentifier(),
                documentType,
                ownerType: OwnerType.owner,
                registrationDate: new Date(Date.now() - DurationMs.Day),
                userIdentifier,
            }
            const updatedDocument2 = { ...document2, fullNameHash: randomUUID() }

            await userDocumentService.updateDocuments(
                userIdentifier,
                documentType,
                [document1, document2, document3],
                mobileUid,
                headers,
                false,
            )
            await userDocumentService.updateDocuments(userIdentifier, documentType, [updatedDocument2], mobileUid, headers, false)

            const result = await userDocumentService.getUserDocuments({ userIdentifier, documentType, mobileUid, activeOnly: false })

            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ ...document1, docStatus: DocStatus.NotFound }),
                    expect.objectContaining(updatedDocument2),
                    expect.objectContaining({ ...document3, docStatus: DocStatus.NotFound }),
                ]),
            )
        })
    })
})
