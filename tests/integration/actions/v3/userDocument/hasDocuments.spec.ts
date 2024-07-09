import { IdentifierService } from '@diia-inhouse/crypto'
import { DocStatus, OwnerType } from '@diia-inhouse/types'

import HasDocumentsAction from '@actions/v3/userDocument/hasDocuments'

import UserDocumentService from '@services/userDocument'

import { RandomData } from '@mocks/randomData'

import SessionGenerator from '@tests/mocks/sessionGenerator'
import { getApp } from '@tests/utils/getApp'

import { UserProfileDocument } from '@interfaces/services/documents'

describe(`Action ${HasDocumentsAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let identifier: IdentifierService
    let userSessionGenerator: SessionGenerator
    let randomData: RandomData
    let hasDocumentsAction: HasDocumentsAction
    let userDocumentService: UserDocumentService

    beforeAll(async () => {
        app = await getApp()

        identifier = app.container.resolve('identifier')!
        userSessionGenerator = new SessionGenerator(identifier)
        randomData = new RandomData(identifier)
        hasDocumentsAction = app.container.build(HasDocumentsAction)
        userDocumentService = app.container.build(UserDocumentService)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    describe('true response', () => {
        it('if only one array presented of oneOf documents and document available', async () => {
            const userIdentifier = randomData.generateUserIdentifier()
            const headers = userSessionGenerator.getHeaders()
            const { mobileUid } = headers

            const document: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }

            await userDocumentService.addDocument(userIdentifier, 'internal-passport', document, mobileUid, headers)

            const hasDocuments = await hasDocumentsAction.handler({
                headers,
                params: {
                    userIdentifier,
                    filters: [[{ documentType: 'internal-passport' }, { documentType: 'foreign-passport' }]],
                },
            })

            expect(hasDocuments).toBe(true)
        })

        it('if documents are available', async () => {
            const userIdentifier = randomData.generateUserIdentifier()
            const headers = userSessionGenerator.getHeaders()
            const { mobileUid } = headers

            const internalPassport: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }
            const driverLicense: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }

            await Promise.all([
                userDocumentService.addDocument(userIdentifier, 'internal-passport', internalPassport, mobileUid, headers),
                userDocumentService.addDocument(userIdentifier, 'driver-license', driverLicense, mobileUid, headers),
            ])

            const hasDocuments = await hasDocumentsAction.handler({
                headers,
                params: {
                    userIdentifier,
                    filters: [
                        [{ documentType: 'internal-passport' }, { documentType: 'foreign-passport' }],
                        [{ documentType: 'driver-license' }],
                    ],
                },
            })

            expect(hasDocuments).toBe(true)
        })

        it('if documents are available with correspond owner types', async () => {
            const userIdentifier = randomData.generateUserIdentifier()
            const headers = userSessionGenerator.getHeaders()
            const { mobileUid } = headers

            const internalPassport: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }
            const driverLicense: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.properUser,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }

            await Promise.all([
                userDocumentService.addDocument(userIdentifier, 'internal-passport', internalPassport, mobileUid, headers),
                userDocumentService.addDocument(userIdentifier, 'driver-license', driverLicense, mobileUid, headers),
            ])

            const hasDocuments = await hasDocumentsAction.handler({
                headers,
                params: {
                    userIdentifier,
                    filters: [
                        [{ documentType: 'internal-passport', ownerType: OwnerType.owner }, { documentType: 'foreign-passport' }],
                        [{ documentType: 'driver-license', ownerType: OwnerType.properUser }],
                    ],
                },
            })

            expect(hasDocuments).toBe(true)
        })
    })

    describe('false response', () => {
        it('if only one array presented of oneOf documents and document not available', async () => {
            const userIdentifier = randomData.generateUserIdentifier()
            const headers = userSessionGenerator.getHeaders()
            const { mobileUid } = headers

            const document: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }

            await userDocumentService.addDocument(userIdentifier, 'driver-license', document, mobileUid, headers)

            const hasDocuments = await hasDocumentsAction.handler({
                headers,
                params: {
                    userIdentifier,
                    filters: [[{ documentType: 'internal-passport' }, { documentType: 'foreign-passport' }]],
                },
            })

            expect(hasDocuments).toBe(false)
        })

        it('if documents are not available', async () => {
            const userIdentifier = randomData.generateUserIdentifier()
            const headers = userSessionGenerator.getHeaders()
            const { mobileUid } = headers

            const internalPassport: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }
            const vehicleLicense: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }

            await Promise.all([
                userDocumentService.addDocument(userIdentifier, 'internal-passport', internalPassport, mobileUid, headers),
                userDocumentService.addDocument(userIdentifier, 'vehicle-license', vehicleLicense, mobileUid, headers),
            ])

            const hasDocuments = await hasDocumentsAction.handler({
                headers,
                params: {
                    userIdentifier,
                    filters: [
                        [{ documentType: 'internal-passport' }, { documentType: 'foreign-passport' }],
                        [{ documentType: 'driver-license' }],
                    ],
                },
            })

            expect(hasDocuments).toBe(false)
        })

        it('if documents are not available with correspond owner types', async () => {
            const userIdentifier = randomData.generateUserIdentifier()
            const headers = userSessionGenerator.getHeaders()
            const { mobileUid } = headers

            const internalPassport: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.owner,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }
            const driverLicense: UserProfileDocument = {
                documentIdentifier: randomData.generateDocumentIdentifier(),
                ownerType: OwnerType.properUser,
                docId: randomData.generateDocId(),
                docStatus: DocStatus.Ok,
            }

            await Promise.all([
                userDocumentService.addDocument(userIdentifier, 'internal-passport', internalPassport, mobileUid, headers),
                userDocumentService.addDocument(userIdentifier, 'driver-license', driverLicense, mobileUid, headers),
            ])

            const hasDocuments = await hasDocumentsAction.handler({
                headers,
                params: {
                    userIdentifier,
                    filters: [
                        [{ documentType: 'internal-passport', ownerType: OwnerType.properUser }, { documentType: 'foreign-passport' }],
                        [{ documentType: 'driver-license', ownerType: OwnerType.properUser }],
                    ],
                },
            })

            expect(hasDocuments).toBe(false)
        })
    })
})
