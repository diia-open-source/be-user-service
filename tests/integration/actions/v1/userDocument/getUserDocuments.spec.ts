import { IdentifierService } from '@diia-inhouse/crypto'
import { AppUserActionHeaders, DocStatus, DocumentType, OwnerType } from '@diia-inhouse/types'

import GetUserDocumentsAction from '@actions/v1/userDocument/getUserDocuments'

import UserDocumentService from '@services/userDocument'

import { RandomData } from '@mocks/randomData'

import SessionGenerator from '@tests/mocks/sessionGenerator'
import { getApp } from '@tests/utils/getApp'

import { UserDocument } from '@interfaces/models/userDocument'
import { UserProfileDocument } from '@interfaces/services/documents'

describe(`Action ${GetUserDocumentsAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let identifier: IdentifierService
    let sessionGenerator: SessionGenerator
    let userDocumentService: UserDocumentService
    let getUserDocumentsAction: GetUserDocumentsAction
    let randomData: RandomData
    let userIdentifier: string
    let headers: AppUserActionHeaders

    beforeAll(async () => {
        app = await getApp()
        identifier = app.container.resolve('identifier')!
        sessionGenerator = new SessionGenerator(identifier)
        userDocumentService = app.container.build(UserDocumentService)
        getUserDocumentsAction = app.container.build(GetUserDocumentsAction)
        randomData = new RandomData(identifier)
        userIdentifier = randomData.generateUserIdentifier()
        headers = sessionGenerator.getHeaders()

        await app.start()
    })

    afterEach(async () => {
        await userDocumentService.removeUserDocuments(userIdentifier)
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return all active user documents', async () => {
        const { mobileUid } = headers
        const documentIdentifiers = randomData.generateDocumentIdentifiers(3)

        const internalPassport: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[0],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.Ok,
        }
        const internalPassportNotFound: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[1],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.NotFound,
        }
        const driverLicense: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[2],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.Ok,
        }

        await Promise.all([
            userDocumentService.addDocument(userIdentifier, DocumentType.InternalPassport, internalPassport, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, DocumentType.InternalPassport, internalPassportNotFound, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, DocumentType.DriverLicense, driverLicense, mobileUid, headers),
        ])

        const { documents } = await getUserDocumentsAction.handler({ headers, params: { userIdentifier } })

        expect(documents).toHaveLength(2)
        expect(documents).toContainObjects<UserDocument>([
            { documentIdentifier: documentIdentifiers[0] },
            { documentIdentifier: documentIdentifiers[2] },
        ])
    })

    it('should return all active user documents by document type', async () => {
        const { mobileUid } = headers
        const documentIdentifiers = randomData.generateDocumentIdentifiers(3)

        const internalPassport: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[0],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.Ok,
        }
        const internalPassportNotFound: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[1],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.NotFound,
        }
        const driverLicense: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[2],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.Ok,
        }

        await Promise.all([
            userDocumentService.addDocument(userIdentifier, DocumentType.InternalPassport, internalPassport, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, DocumentType.InternalPassport, internalPassportNotFound, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, DocumentType.DriverLicense, driverLicense, mobileUid, headers),
        ])

        const { documents } = await getUserDocumentsAction.handler({
            headers,
            params: { userIdentifier, documentType: DocumentType.InternalPassport },
        })

        expect(documents).toHaveLength(1)
        expect(documents).toContainObjects<UserDocument>([{ documentIdentifier: documentIdentifiers[0] }])
    })

    it('should return all user documents (active and inactive)', async () => {
        const { mobileUid } = headers
        const documentIdentifiers = randomData.generateDocumentIdentifiers(2)

        const internalPassport: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[0],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.Ok,
        }
        const driverLicense: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[1],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.NotFound,
        }

        await Promise.all([
            userDocumentService.addDocument(userIdentifier, DocumentType.InternalPassport, internalPassport, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, DocumentType.DriverLicense, driverLicense, mobileUid, headers),
        ])

        const { documents } = await getUserDocumentsAction.handler({ headers, params: { userIdentifier, activeOnly: false } })

        expect(documents).toHaveLength(2)
        expect(documents).toContainObjects<UserDocument>([
            { documentIdentifier: documentIdentifiers[0] },
            { documentIdentifier: documentIdentifiers[1] },
        ])
    })
})
