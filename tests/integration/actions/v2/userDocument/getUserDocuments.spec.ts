import { IdentifierService } from '@diia-inhouse/crypto'
import { AppUserActionHeaders, DocStatus, OwnerType } from '@diia-inhouse/types'

import GetUserDocumentsAction from '@actions/v2/userDocument/getUserDocuments'

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
    let randomData: RandomData
    let getUserDocumentsAction: GetUserDocumentsAction
    let userDocumentService: UserDocumentService
    let userIdentifier: string
    let headers: AppUserActionHeaders

    beforeAll(async () => {
        app = await getApp()
        identifier = app.container.resolve('identifier')!
        sessionGenerator = new SessionGenerator(identifier)
        randomData = new RandomData(identifier)
        getUserDocumentsAction = app.container.build(GetUserDocumentsAction)
        userDocumentService = app.container.build(UserDocumentService)
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

    it('should return active user documents by filter', async () => {
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
            userDocumentService.addDocument(userIdentifier, 'internal-passport', internalPassport, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, 'internal-passport', internalPassportNotFound, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, 'driver-license', driverLicense, mobileUid, headers),
        ])

        const { documents } = await getUserDocumentsAction.handler({
            headers,
            params: { userIdentifier, filters: [{ documentType: 'internal-passport', docStatus: [] }] },
        })

        expect(documents).toHaveLength(1)
        expect(documents).toContainObjects<UserDocument>([{ documentIdentifier: documentIdentifiers[0] }])
    })

    it('should return active user documents by each filter', async () => {
        const { mobileUid } = headers
        const documentIdentifiers = randomData.generateDocumentIdentifiers(3)

        const internalPassport: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[0],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.Ok,
        }
        const foreignPassport: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[1],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.Ok,
        }
        const driverLicense: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[2],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.Ok,
        }

        await Promise.all([
            userDocumentService.addDocument(userIdentifier, 'internal-passport', internalPassport, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, 'foreign-passport', foreignPassport, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, 'driver-license', driverLicense, mobileUid, headers),
        ])

        const { documents } = await getUserDocumentsAction.handler({
            headers,
            params: {
                userIdentifier,
                filters: [
                    { documentType: 'internal-passport', docStatus: [] },
                    { documentType: 'foreign-passport', docStatus: [] },
                ],
            },
        })

        expect(documents).toHaveLength(2)
        expect(documents).toContainObjects<UserDocument>([
            { documentIdentifier: documentIdentifiers[0] },
            { documentIdentifier: documentIdentifiers[1] },
        ])
    })

    it('should return user documents by docStatus in filter', async () => {
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
        const driverLicenseNotFound: UserProfileDocument = {
            documentIdentifier: documentIdentifiers[2],
            ownerType: OwnerType.owner,
            docId: randomData.generateDocId(),
            docStatus: DocStatus.NotFound,
        }

        await Promise.all([
            userDocumentService.addDocument(userIdentifier, 'internal-passport', internalPassport, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, 'internal-passport', internalPassportNotFound, mobileUid, headers),
            userDocumentService.addDocument(userIdentifier, 'driver-license', driverLicenseNotFound, mobileUid, headers),
        ])

        const { documents } = await getUserDocumentsAction.handler({
            headers,
            params: {
                userIdentifier,
                filters: [
                    { documentType: 'internal-passport', docStatus: [DocStatus.NotFound] },
                    { documentType: 'driver-license', docStatus: [] },
                ],
            },
        })

        expect(documents).toHaveLength(1)
        expect(documents).toContainObjects<UserDocument>([{ documentIdentifier: documentIdentifiers[1] }])
    })
})
