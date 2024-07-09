import { randomUUID } from 'node:crypto'

import { IdentifierService } from '@diia-inhouse/crypto'
import { DocStatus, OwnerType } from '@diia-inhouse/types'

import HasDocumentsAction from '@actions/v4/userDocument/hasDocuments'

import UserDocumentService from '@services/userDocument'

import SessionGenerator from '@tests/mocks/sessionGenerator'
import { getApp } from '@tests/utils/getApp'

import { UserProfileDocument } from '@interfaces/services/documents'

describe(`Action ${HasDocumentsAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let identifier: IdentifierService
    let sessionGenerator: SessionGenerator
    let hasDocumentsAction: HasDocumentsAction
    let userDocumentService: UserDocumentService

    beforeAll(async () => {
        app = await getApp()

        identifier = app.container.resolve('identifier')!
        sessionGenerator = new SessionGenerator(identifier)
        hasDocumentsAction = app.container.build(HasDocumentsAction)
        userDocumentService = app.container.build(UserDocumentService)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    describe('true response', () => {
        it.each([DocStatus.Ok])('should be returned when docStatus is not provided', async (docStatus) => {
            const userIdentifier = randomUUID()
            const headers = sessionGenerator.getHeaders()
            const { mobileUid } = headers

            const document: UserProfileDocument = {
                documentIdentifier: randomUUID(),
                ownerType: OwnerType.owner,
                docId: randomUUID(),
                docStatus,
            }

            await userDocumentService.addDocument(userIdentifier, 'internal-passport', document, mobileUid, headers)

            const { hasDocuments } = await hasDocumentsAction.handler({
                headers,
                params: {
                    userIdentifier,
                    filters: [[{ documentType: 'internal-passport' }]],
                },
            })

            expect(hasDocuments).toBe(true)
        })

        it('should be returned when docStatus matched', async () => {
            const userIdentifier = randomUUID()
            const headers = sessionGenerator.getHeaders()
            const { mobileUid } = headers

            const docStatus = DocStatus.Ok
            const document: UserProfileDocument = {
                documentIdentifier: randomUUID(),
                ownerType: OwnerType.owner,
                docId: randomUUID(),
                docStatus,
            }

            await userDocumentService.addDocument(userIdentifier, 'internal-passport', document, mobileUid, headers)

            const { hasDocuments } = await hasDocumentsAction.handler({
                headers,
                params: {
                    userIdentifier,
                    filters: [[{ documentType: 'internal-passport', docStatus: [docStatus, DocStatus.Deleting] }]],
                },
            })

            expect(hasDocuments).toBe(true)
        })
    })

    describe('false response', () => {
        it.each([DocStatus.Deleting])('should be returned when docStatus is not matched', async (docStatus) => {
            const userIdentifier = randomUUID()
            const headers = sessionGenerator.getHeaders()
            const { mobileUid } = headers

            const document: UserProfileDocument = {
                documentIdentifier: randomUUID(),
                ownerType: OwnerType.owner,
                docId: randomUUID(),
                docStatus,
            }

            await userDocumentService.addDocument(userIdentifier, 'internal-passport', document, mobileUid, headers)

            const { hasDocuments } = await hasDocumentsAction.handler({
                headers,
                params: {
                    userIdentifier,
                    filters: [[{ documentType: 'internal-passport', docStatus: [DocStatus.Ok] }]],
                },
            })

            expect(hasDocuments).toBe(false)
        })
    })
})
