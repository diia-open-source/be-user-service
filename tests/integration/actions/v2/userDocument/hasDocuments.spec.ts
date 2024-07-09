import { IdentifierService } from '@diia-inhouse/crypto'
import { DocStatus, OwnerType } from '@diia-inhouse/types'

import HasDocumentsAction from '@actions/v2/userDocument/hasDocuments'

import UserDocumentService from '@services/userDocument'

import { RandomData } from '@mocks/randomData'

import SessionGenerator from '@tests/mocks/sessionGenerator'
import { getApp } from '@tests/utils/getApp'

import { UserProfileDocument } from '@interfaces/services/documents'

describe(`Action ${HasDocumentsAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let identifier: IdentifierService
    let randomData: RandomData
    let sessionGenerator: SessionGenerator
    let hasDocumentsAction: HasDocumentsAction
    let userDocumentService: UserDocumentService

    beforeAll(async () => {
        app = await getApp()
        identifier = app.container.resolve('identifier')!
        randomData = new RandomData(identifier)
        sessionGenerator = new SessionGenerator(identifier)
        hasDocumentsAction = app.container.build(HasDocumentsAction)
        userDocumentService = app.container.build(UserDocumentService)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return true by only one array presented of oneOf documents if document available', async () => {
        const userIdentifier = randomData.generateUserIdentifier()
        const headers = sessionGenerator.getHeaders()
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
            params: { userIdentifier, documentTypes: [['internal-passport', 'foreign-passport']] },
        })

        await userDocumentService.removeUserDocuments(userIdentifier)

        expect(hasDocuments).toBe(true)
    })

    it('should return false by only one array presented of oneOf documents if document not available', async () => {
        const userIdentifier = randomData.generateUserIdentifier()
        const headers = sessionGenerator.getHeaders()
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
            params: { userIdentifier, documentTypes: [['internal-passport', 'foreign-passport']] },
        })

        await userDocumentService.removeUserDocuments(userIdentifier)

        expect(hasDocuments).toBe(false)
    })

    it('should return true if documents are available', async () => {
        const userIdentifier = randomData.generateUserIdentifier()
        const headers = sessionGenerator.getHeaders()
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
                documentTypes: [['internal-passport', 'foreign-passport'], ['driver-license']],
            },
        })

        await userDocumentService.removeUserDocuments(userIdentifier)

        expect(hasDocuments).toBe(true)
    })

    it('should return false if documents are not available', async () => {
        const userIdentifier = randomData.generateUserIdentifier()
        const headers = sessionGenerator.getHeaders()
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
                documentTypes: [['internal-passport', 'foreign-passport'], ['driver-license']],
            },
        })

        await userDocumentService.removeUserDocuments(userIdentifier)

        expect(hasDocuments).toBe(false)
    })
})
