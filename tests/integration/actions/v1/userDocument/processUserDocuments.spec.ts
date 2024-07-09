import { randomUUID } from 'node:crypto'

import { asClass } from '@diia-inhouse/diia-app'

import TestKit from '@diia-inhouse/test'
import { DocStatus, OwnerType } from '@diia-inhouse/types'

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
                const sourceDocType = 'driver-license'
                const docTypeToCompare = 'internal-passport'
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
                const sourceDocType = 'driver-license'
                const docTypeToCompare = 'internal-passport'
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
                const sourceDocType = 'driver-license'
                const docTypesToCompare = ['internal-passport', 'foreign-passport']
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
                    params: { userIdentifier, documentTypes: ['foreign-passport'] },
                })

                // Assert
                await userDocumentModel.deleteMany({
                    userIdentifier,
                })

                expect(processedUserDocuments).toEqual([[sourceDocType, 'internal-passport']])
            })
        })

        describe('not process document', () => {
            it('should not process if received doc is absent in the comparing map', async () => {
                // Arrange
                const {
                    user: { identifier: userIdentifier },
                } = testKit.session.getUserSession()
                const sourceDocType = 'driver-license'
                const docTypeToCompare = 'internal-passport'
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
                    params: { userIdentifier, documentTypes: ['birth-certificate'] },
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
                const sourceDocType = 'driver-license'
                const docTypeToCompare = 'internal-passport'
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
                const sourceDocType = 'driver-license'
                const docTypeToCompare = 'internal-passport'
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
        describe(`${'driver-license'} strategy`, () => {
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
                                documentType: 'driver-license',
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                            },
                            {
                                userIdentifier,
                                documentType: 'internal-passport',
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
                            params: { userIdentifier, documentTypes: ['driver-license'] },
                        })

                        // Assert
                        expect(createNotificationSpy).toHaveBeenCalledTimes(1)
                        expect(createNotificationSpy).toHaveBeenCalledWith({
                            userIdentifier,
                            templateCode: MessageTemplateCode.DriverLicenseDataChanged,
                        })
                        const sourceDoc = await userDocumentModel.findOne({
                            userIdentifier,
                            documentType: 'driver-license',
                            documentIdentifier: driverLicense.documentIdentifier,
                        })

                        await userDocumentModel.deleteMany({
                            userIdentifier,
                        })

                        expect(sourceDoc).toMatchObject<Partial<UserDocument>>({
                            comparedTo: { documentType: 'internal-passport', fullNameHash: internalPassport.fullNameHash! },
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
                                documentType: 'driver-license',
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                                comparedTo: {
                                    documentType: 'internal-passport',
                                    fullNameHash: randomUUID(),
                                },
                            },
                            {
                                userIdentifier,
                                documentType: 'internal-passport',
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
                            params: { userIdentifier, documentTypes: ['internal-passport'] },
                        })

                        // Assert
                        expect(createNotificationSpy).toHaveBeenCalledTimes(1)
                        expect(createNotificationSpy).toHaveBeenCalledWith({
                            userIdentifier,
                            templateCode: MessageTemplateCode.DriverLicenseDataChanged,
                        })
                        const sourceDoc = await userDocumentModel.findOne({
                            userIdentifier,
                            documentType: 'driver-license',
                            documentIdentifier: driverLicense.documentIdentifier,
                        })

                        await userDocumentModel.deleteMany({
                            userIdentifier,
                        })

                        expect(sourceDoc).toMatchObject<Partial<UserDocument>>({
                            comparedTo: { documentType: 'internal-passport', fullNameHash: internalPassport.fullNameHash! },
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
                                documentType: 'driver-license',
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash,
                                notifications: {},
                            },
                            {
                                userIdentifier,
                                documentType: 'internal-passport',
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
                            params: { userIdentifier, documentTypes: ['driver-license'] },
                        })

                        // Assert
                        expect(createNotificationSpy).toHaveBeenCalledTimes(0)
                        const sourceDoc = await userDocumentModel.findOne({
                            userIdentifier,
                            documentType: 'driver-license',
                            documentIdentifier: driverLicense.documentIdentifier,
                        })

                        await userDocumentModel.deleteMany({
                            userIdentifier,
                        })

                        expect(sourceDoc).toMatchObject<Partial<UserDocument>>({
                            comparedTo: { documentType: 'internal-passport', fullNameHash: internalPassport.fullNameHash! },
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
                                documentType: 'driver-license',
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                                comparedTo: {
                                    documentType: 'internal-passport',
                                    fullNameHash: docToCompareFullNameHash,
                                },
                            },
                            {
                                userIdentifier,
                                documentType: 'internal-passport',
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
                            params: { userIdentifier, documentTypes: ['internal-passport'] },
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
                                documentType: 'driver-license',
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                notifications: {},
                            },
                            {
                                userIdentifier,
                                documentType: 'internal-passport',
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
                            params: { userIdentifier, documentTypes: ['internal-passport'] },
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
                                documentType: 'driver-license',
                                documentIdentifier: randomUUID(),
                                ownerType: OwnerType.owner,
                                docStatus: DocStatus.Ok,
                                fullNameHash: randomUUID(),
                                notifications: {},
                            },
                            {
                                userIdentifier,
                                documentType: 'internal-passport',
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
                            params: { userIdentifier, documentTypes: ['internal-passport'] },
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
