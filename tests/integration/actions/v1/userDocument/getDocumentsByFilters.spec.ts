import { IdentifierService } from '@diia-inhouse/crypto'
import { AppUserActionHeaders, DocStatus, OwnerType } from '@diia-inhouse/types'

import GetDocumentsByFilters from '@actions/v1/userDocument/getDocumentsByFilters'

import UserDocumentService from '@services/userDocument'

import { RandomData } from '@mocks/randomData'
import SessionGenerator from '@mocks/sessionGenerator'

import { getApp } from '@tests/utils/getApp'

import { UserDocument } from '@interfaces/models/userDocument'
import { UserProfileDocument } from '@interfaces/services/documents'

describe(`Action ${GetDocumentsByFilters.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let identifier: IdentifierService
    let sessionGenerator: SessionGenerator
    let randomData: RandomData
    let getDocumentsByFiltersAction: GetDocumentsByFilters
    let userDocumentService: UserDocumentService
    let userIdentifier: string
    let headers: AppUserActionHeaders

    beforeAll(async () => {
        app = await getApp()
        identifier = app.container.resolve('identifier')!
        sessionGenerator = new SessionGenerator(identifier)
        randomData = new RandomData(identifier)
        getDocumentsByFiltersAction = app.container.build(GetDocumentsByFilters)
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

    it('should return active documents by filter', async () => {
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

        const { documents } = await getDocumentsByFiltersAction.handler({
            headers,
            params: { filters: [{ documentIdentifier: documentIdentifiers[0], documentType: 'internal-passport' }] },
        })

        expect(documents).toHaveLength(1)
        expect(documents).toContainObjects<UserDocument>([{ documentIdentifier: documentIdentifiers[0] }])
    })

    it('should return active documents by each filter', async () => {
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

        const { documents } = await getDocumentsByFiltersAction.handler({
            headers,
            params: {
                filters: [
                    { documentIdentifier: documentIdentifiers[0], documentType: 'internal-passport' },
                    { documentIdentifier: documentIdentifiers[1], documentType: 'foreign-passport' },
                ],
            },
        })

        expect(documents).toHaveLength(2)
        expect(documents).toContainObjects<UserDocument>([
            { documentIdentifier: documentIdentifiers[0] },
            { documentIdentifier: documentIdentifiers[1] },
        ])
    })

    it('should return documents by docStatus in filter', async () => {
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

        const { documents } = await getDocumentsByFiltersAction.handler({
            headers,
            params: {
                filters: [
                    {
                        documentIdentifier: documentIdentifiers[1],
                        documentType: 'internal-passport',
                        docStatus: [DocStatus.NotFound],
                    },
                    {
                        documentIdentifier: documentIdentifiers[2],
                        documentType: 'driver-license',
                    },
                ],
            },
        })

        expect(documents).toHaveLength(1)
        expect(documents).toContainObjects<UserDocument>([{ documentIdentifier: documentIdentifiers[1] }])
    })
})
