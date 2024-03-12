import { randomUUID } from 'crypto'

import { asClass } from 'awilix'

import TestKit from '@diia-inhouse/test'
import { DocStatus, DocumentType, OwnerType } from '@diia-inhouse/types'

import ProcessUserDocumentsAction from '@src/actions/v1/userDocument/processUserDocuments'

import NotificationService from '@services/notification'
import UserDocumentService from '@services/userDocument'

import userDocumentModel from '@models/userDocument'

import { getApp } from '@tests/utils/getApp'

import { UserDocument } from '@interfaces/models/userDocument'
import { MessageTemplateCode } from '@interfaces/services/notification'

describe(`Action ${ProcessUserDocumentsAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let testKit: TestKit
    let notificationService: NotificationService
    let processUserDocumentsAction: ProcessUserDocumentsAction

    beforeAll(async () => {
        app = await getApp()

        testKit = app.container.resolve('testKit')
        notificationService = app.container.resolve('notificationService')
        processUserDocumentsAction = app.container.build(ProcessUserDocumentsAction)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    describe('general processing logic', () => {
        describe('process document', () => {
            it('should process when source doc received', async () => {
                // Arrange
                const {
                    user: { identifier: userIdentifier },
                } = testKit.session.getUserSession()
                const sourceDocType = DocumentType.DriverLicense
                const docTypeToCompare = DocumentType.InternalPassport
                const comparingMap: UserDocumentService['comparingMap'] = {
                    [sourceDocType]: [docTypeToCompare],
                }
                const docsToInsert: UserDocument[] = [sourceDocType, docTypeToCompare].map((documentType) => ({
                    userIdentifier,
                    documentType,
                    documentIdentifier: randomUUID(),
                    ownerType: OwnerType.owner,
                    docStatus: DocStatus.Ok,
                    notifications: {},
                }))

                await userDocumentModel.insertMany(docsToInsert)
                app.container.register(
                    'userDocumentService',
                    asClass(UserDocumentService).inject(() => ({ comparingMap })),
                )

                // Act
                const processedUserDocuments = await processUserDocumentsAction.handler({
                    headers: testKit.session.getHeaders(),
                    params: { userIdentifier, documentTypes: [sourceDocType] },
                })

                // Assert
                await userDocumentModel.deleteMany({
                    userIdentifier,
                })
                expect(processedUserDocuments).toEqual([[sourceDocType, docTypeToCompare]])
            })

            it('should process when doc to compare received', async () => {
                // Arrange
                const {
                    user: { identifier: userIdentifier },
                } = testKit.session.getUserSession()
                const sourceDocType = DocumentType.DriverLicense
                const docTypeToCompare = DocumentType.InternalPassport
                const comparingMap: UserDocumentService['comparingMap'] = {
                    [sourceDocType]: [docTypeToCompare],
                }
                const docsToInsert: UserDocument[] = [sourceDocType, docTypeToCompare].map((documentType) => ({
                    userIdentifier,
                    documentType,
                    documentIdentifier: randomUUID(),
                    ownerType: OwnerType.owner,
                    docStatus: DocStatus.Ok,
                    notifications: {},
                }))

                await userDocumentModel.insertMany(docsToInsert)
                app.container.register(
                    'userDocumentService',
                    asClass(UserDocumentService).inject(() => ({ comparingMap })),
                )

                // Act
                const processedUserDocuments = await processUserDocumentsAction.handler({
                    headers: testKit.session.getHeaders(),
                    params: { userIdentifier, documentTypes: [docTypeToCompare] },
                })

                // Assert
                await userDocumentModel.deleteMany({
                    userIdentifier,
                })

                expect(processedUserDocuments).toEqual([[sourceDocType, docTypeToCompare]])
            })

            it('should process using doc to compare with highest priority when multiple exists', async () => {
                // Arrange
                const {
                    user: { identifier: userIdentifier },
                } = testKit.session.getUserSession()
                const sourceDocType = DocumentType.DriverLicense
                const docTypesToCompare = [DocumentType.InternalPassport, DocumentType.ForeignPassport]
                const comparingMap: UserDocumentService['comparingMap'] = {
                    [sourceDocType]: docTypesToCompare,
                }
                const docsToInsert: UserDocument[] = [sourceDocType, ...docTypesToCompare].map((documentType) => ({
                    userIdentifier,
                    documentType,
                    documentIdentifier: randomUUID(),
                    ownerType: OwnerType.owner,
                    docStatus: DocStatus.Ok,
                    notifications: {},
                }))

                await userDocumentModel.insertMany(docsToInsert)
                app.container.register(
                    'userDocumentService',
                    asClass(UserDocumentService).inject(() => ({ comparingMap })),
                )

                // Act
                const processedUserDocuments = await processUserDocumentsAction.handler({
                    headers: testKit.session.getHeaders(),
                    params: { userIdentifier, documentTypes: [DocumentType.ForeignPassport] },
                })

                // Assert
                await userDocumentModel.deleteMany({
                    userIdentifier,
                })

                expect(processedUserDocuments).toEqual([[sourceDocType, DocumentType.InternalPassport]])
            })
        })

        describe('not process document', () => {
            it('should not process if received doc is absent in the comparing map', async () => {
                // Arrange
                const {
                    user: { identifier: userIdentifier },
                } = testKit.session.getUserSession()
                const sourceDocType = DocumentType.DriverLicense
                const docTypeToCompare = DocumentType.InternalPassport
                const comparingMap: UserDocumentService['comparingMap'] = {
                    [sourceDocType]: [docTypeToCompare],
                }
                const docsToInsert: UserDocument[] = [sourceDocType, docTypeToCompare].map((documentType) => ({
                    userIdentifier,
                    documentType,
                    documentIdentifier: randomUUID(),
                    ownerType: OwnerType.owner,
                    docStatus: DocStatus.Ok,
                    notifications: {},
                }))

                await userDocumentModel.insertMany(docsToInsert)
                app.container.register(
                    'userDocumentService',
                    asClass(UserDocumentService).inject(() => ({ comparingMap })),
                )

                // Act
                const processedUserDocuments = await processUserDocumentsAction.handler({
                    headers: testKit.session.getHeaders(),
                    params: { userIdentifier, documentTypes: [DocumentType.BirthCertificate] },
                })

                // Assert
                await userDocumentModel.deleteMany({
                    userIdentifier,
                })

                expect(processedUserDocuments).toEqual([])
            })

            it('should not process when source doc is absent in db', async () => {
                // Arrange
                const {
                    user: { identifier: userIdentifier },
                } = testKit.session.getUserSession()
                const sourceDocType = DocumentType.DriverLicense
                const docTypeToCompare = DocumentType.InternalPassport
                const comparingMap: UserDocumentService['comparingMap'] = {
                    [sourceDocType]: [docTypeToCompare],
                }
                const docsToInsert: UserDocument[] = [docTypeToCompare].map((documentType) => ({
                    userIdentifier,
                    documentType,
                    documentIdentifier: randomUUID(),
                    ownerType: OwnerType.owner,
                    docStatus: DocStatus.Ok,
                    notifications: {},
                }))

                await userDocumentModel.insertMany(docsToInsert)
                app.container.register(
                    'userDocumentService',
                    asClass(UserDocumentService).inject(() => ({ comparingMap })),
                )

                // Act
                const processedUserDocuments = await processUserDocumentsAction.handler({
                    headers: testKit.session.getHeaders(),
                    params: { userIdentifier, documentTypes: [sourceDocType] },
                })

                // Assert
                await userDocumentModel.deleteMany({
                    userIdentifier,
                })

                expect(processedUserDocuments).toEqual([])
            })

            it('should not process when doc to compare is absent in db', async () => {
                // Arrange
                const {
                    user: { identifier: userIdentifier },
                } = testKit.session.getUserSession()
                const sourceDocType = DocumentType.DriverLicense
                const docTypeToCompare = DocumentType.InternalPassport
                const comparingMap: UserDocumentService['comparingMap'] = {
                    [sourceDocType]: [docTypeToCompare],
                }
                const docsToInsert: UserDocument[] = [sourceDocType].map((documentType) => ({
                    userIdentifier,
                    documentType,
                    documentIdentifier: randomUUID(),
                    ownerType: OwnerType.owner,
                    docStatus: DocStatus.Ok,
                    notifications: {},
                }))

                await userDocumentModel.insertMany(docsToInsert)
                app.container.register(
                    'userDocumentService',
                    asClass(UserDocumentService).inject(() => ({ comparingMap })),
                )

                // Act
                const processedUserDocuments = await processUserDocumentsAction.handler({
                    headers: testKit.session.getHeaders(),
                    params: { userIdentifier, documentTypes: [sourceDocType] },
                })

                // Assert
                await userDocumentModel.deleteMany({
                    userIdentifier,
                })

                expect(processedUserDocuments).toEqual([])
            })
        })
    })

    describe('specific processing strategies', () => {
        describe(`${DocumentType.DriverLicense} strategy`, () => {
            describe(`notification ${MessageTemplateCode.DriverLicenseDataChanged}`, () => {
                describe('when send', () => {
                    it('should send when "compared to" document is absent and hashes mismatched', async () => {
                        // Arrange
                        const {
                            user: { identifier: userIdentifier },
                        } = testKit.session.getUserSession()
                        const [driverLicense, internalPassport]: UserDocument[] = [
                            {
                                userIdentifier,
                                documentType: DocumentType.DriverLicense,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                            },
                            {
                                userIdentifier,
                                documentType: DocumentType.InternalPassport,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                            },
                        ]

                        await userDocumentModel.insertMany([driverLicense, internalPassport])
                        const createNotificationSpy = jest.spyOn(notificationService, 'createNotificationWithPushesSafe')

                        // Act
                        await processUserDocumentsAction.handler({
                            headers: testKit.session.getHeaders(),
                            params: { userIdentifier, documentTypes: [DocumentType.DriverLicense] },
                        })

                        // Assert
                        expect(createNotificationSpy).toHaveBeenCalledTimes(1)
                        expect(createNotificationSpy).toHaveBeenCalledWith({
                            userIdentifier,
                            templateCode: MessageTemplateCode.DriverLicenseDataChanged,
                        })
                        const sourceDoc = await userDocumentModel.findOne({
                            userIdentifier,
                            documentType: DocumentType.DriverLicense,
                            documentIdentifier: driverLicense.documentIdentifier,
                        })

                        await userDocumentModel.deleteMany({
                            userIdentifier,
                        })

                        expect(sourceDoc).toMatchObject<Partial<UserDocument>>({
                            comparedTo: { documentType: DocumentType.InternalPassport, fullNameHash: internalPassport.fullNameHash! },
                        })
                    })

                    it('should send when "compared to" document is exist and not equal to a new doc to compare', async () => {
                        // Arrange
                        const {
                            user: { identifier: userIdentifier },
                        } = testKit.session.getUserSession()
                        const [driverLicense, internalPassport]: UserDocument[] = [
                            {
                                userIdentifier,
                                documentType: DocumentType.DriverLicense,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                                comparedTo: {
                                    documentType: DocumentType.InternalPassport,
                                    fullNameHash: randomUUID(),
                                },
                            },
                            {
                                userIdentifier,
                                documentType: DocumentType.InternalPassport,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                            },
                        ]

                        await userDocumentModel.insertMany([driverLicense, internalPassport])
                        const createNotificationSpy = jest.spyOn(notificationService, 'createNotificationWithPushesSafe')

                        // Act
                        await processUserDocumentsAction.handler({
                            headers: testKit.session.getHeaders(),
                            params: { userIdentifier, documentTypes: [DocumentType.InternalPassport] },
                        })

                        // Assert
                        expect(createNotificationSpy).toHaveBeenCalledTimes(1)
                        expect(createNotificationSpy).toHaveBeenCalledWith({
                            userIdentifier,
                            templateCode: MessageTemplateCode.DriverLicenseDataChanged,
                        })
                        const sourceDoc = await userDocumentModel.findOne({
                            userIdentifier,
                            documentType: DocumentType.DriverLicense,
                            documentIdentifier: driverLicense.documentIdentifier,
                        })

                        await userDocumentModel.deleteMany({
                            userIdentifier,
                        })

                        expect(sourceDoc).toMatchObject<Partial<UserDocument>>({
                            comparedTo: { documentType: DocumentType.InternalPassport, fullNameHash: internalPassport.fullNameHash! },
                        })
                    })
                })

                describe('when not send', () => {
                    it('should not send when "compared to" document is absent and hashes matched', async () => {
                        // Arrange
                        const {
                            user: { identifier: userIdentifier },
                        } = testKit.session.getUserSession()
                        const fullNameHash = randomUUID()
                        const [driverLicense, internalPassport]: UserDocument[] = [
                            {
                                userIdentifier,
                                documentType: DocumentType.DriverLicense,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash,
                                notifications: {},
                            },
                            {
                                userIdentifier,
                                documentType: DocumentType.InternalPassport,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash,
                                notifications: {},
                            },
                        ]

                        await userDocumentModel.insertMany([driverLicense, internalPassport])
                        const createNotificationSpy = jest.spyOn(notificationService, 'createNotificationWithPushesSafe')

                        // Act
                        await processUserDocumentsAction.handler({
                            headers: testKit.session.getHeaders(),
                            params: { userIdentifier, documentTypes: [DocumentType.DriverLicense] },
                        })

                        // Assert
                        expect(createNotificationSpy).toHaveBeenCalledTimes(0)
                        const sourceDoc = await userDocumentModel.findOne({
                            userIdentifier,
                            documentType: DocumentType.DriverLicense,
                            documentIdentifier: driverLicense.documentIdentifier,
                        })

                        await userDocumentModel.deleteMany({
                            userIdentifier,
                        })

                        expect(sourceDoc).toMatchObject<Partial<UserDocument>>({
                            comparedTo: { documentType: DocumentType.InternalPassport, fullNameHash: internalPassport.fullNameHash! },
                        })
                    })

                    it('should not send when "compared to" document is exist and equal to a new doc to compare', async () => {
                        // Arrange
                        const {
                            user: { identifier: userIdentifier },
                        } = testKit.session.getUserSession()
                        const docToCompareFullNameHash = randomUUID()
                        const [driverLicense, internalPassport]: UserDocument[] = [
                            {
                                userIdentifier,
                                documentType: DocumentType.DriverLicense,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                                comparedTo: {
                                    documentType: DocumentType.InternalPassport,
                                    fullNameHash: docToCompareFullNameHash,
                                },
                            },
                            {
                                userIdentifier,
                                documentType: DocumentType.InternalPassport,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: docToCompareFullNameHash,
                                notifications: {},
                            },
                        ]

                        await userDocumentModel.insertMany([driverLicense, internalPassport])
                        const createNotificationSpy = jest.spyOn(notificationService, 'createNotificationWithPushesSafe')

                        // Act
                        await processUserDocumentsAction.handler({
                            headers: testKit.session.getHeaders(),
                            params: { userIdentifier, documentTypes: [DocumentType.InternalPassport] },
                        })

                        await userDocumentModel.deleteMany({
                            userIdentifier,
                        })

                        // Assert
                        expect(createNotificationSpy).toHaveBeenCalledTimes(0)
                    })

                    it('should not send when source doc does not contain a fullNameHash', async () => {
                        // Arrange
                        const {
                            user: { identifier: userIdentifier },
                        } = testKit.session.getUserSession()
                        const [driverLicense, internalPassport]: UserDocument[] = [
                            {
                                userIdentifier,
                                documentType: DocumentType.DriverLicense,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                notifications: {},
                            },
                            {
                                userIdentifier,
                                documentType: DocumentType.InternalPassport,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                            },
                        ]

                        await userDocumentModel.insertMany([driverLicense, internalPassport])
                        const createNotificationSpy = jest.spyOn(notificationService, 'createNotificationWithPushesSafe')

                        // Act
                        await processUserDocumentsAction.handler({
                            headers: testKit.session.getHeaders(),
                            params: { userIdentifier, documentTypes: [DocumentType.InternalPassport] },
                        })

                        // Assert
                        await userDocumentModel.deleteMany({
                            userIdentifier,
                        })
                        expect(createNotificationSpy).toHaveBeenCalledTimes(0)
                    })

                    it('should not send when doc to compare does not contain a fullNameHash', async () => {
                        // Arrange
                        const {
                            user: { identifier: userIdentifier },
                        } = testKit.session.getUserSession()
                        const [driverLicense, internalPassport]: UserDocument[] = [
                            {
                                userIdentifier,
                                documentType: DocumentType.DriverLicense,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                            },
                            {
                                userIdentifier,
                                documentType: DocumentType.InternalPassport,
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                notifications: {},
                            },
                        ]

                        await userDocumentModel.insertMany([driverLicense, internalPassport])
                        const createNotificationSpy = jest.spyOn(notificationService, 'createNotificationWithPushesSafe')

                        // Act
                        await processUserDocumentsAction.handler({
                            headers: testKit.session.getHeaders(),
                            params: { userIdentifier, documentTypes: [DocumentType.InternalPassport] },
                        })

                        // Assert
                        await userDocumentModel.deleteMany({
                            userIdentifier,
                        })

                        expect(createNotificationSpy).toHaveBeenCalledTimes(0)
                    })
                })
            })
        })
    })
})
