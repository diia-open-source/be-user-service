import { FilterQuery } from 'mongoose'

import { IdentifierService } from '@diia-inhouse/crypto'
import { DocStatus, DocumentType, OwnerType } from '@diia-inhouse/types'

import AddDocumentInProfileEventListener from '@src/eventListeners/addDocumentInProfile'

import userDocumentModel from '@models/userDocument'

import { RandomData } from '@mocks/randomData'

import SessionGenerator from '@tests/mocks/sessionGenerator'
import { getApp } from '@tests/utils/getApp'

import { EventPayload } from '@interfaces/eventListeners/addDocumentInProfile'
import { UserDocument, UserDocumentModel } from '@interfaces/models/userDocument'

describe(`Event listener ${AddDocumentInProfileEventListener.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let identifier: IdentifierService
    let sessionGenerator: SessionGenerator
    let randomData: RandomData
    let addDocumentInProfileEventListener: AddDocumentInProfileEventListener

    beforeAll(async () => {
        app = await getApp()

        identifier = app.container.resolve('identifier')!
        sessionGenerator = new SessionGenerator(identifier)
        randomData = new RandomData(identifier)
        addDocumentInProfileEventListener = app.container.build(AddDocumentInProfileEventListener)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should create new user document if not exist', async () => {
        const userIdentifier = randomData.generateUserIdentifier()
        const documentIdentifier = randomData.generateDocumentIdentifier()
        const headers = sessionGenerator.getHeaders()

        const msg: EventPayload = {
            userIdentifier,
            documentType: DocumentType.DriverLicense,
            documentIdentifier,
            ownerType: OwnerType.owner,
            docId: '123',
            docStatus: DocStatus.Ok,
            headers,
        }

        const query: FilterQuery<UserDocumentModel> = {
            userIdentifier: msg.userIdentifier,
            documentType: msg.documentType,
            documentIdentifier: msg.documentIdentifier,
        }

        const beforeStoredDocuments: UserDocumentModel[] = await userDocumentModel.find(query)

        await addDocumentInProfileEventListener.handler(msg)

        const storedDocuments: UserDocumentModel[] = await userDocumentModel.find(query)

        expect(beforeStoredDocuments).toHaveLength(0)
        expect(storedDocuments).toHaveLength(1)
        expect(storedDocuments[0]).toEqual(
            expect.objectContaining({
                userIdentifier: msg.userIdentifier,
                documentType: msg.documentType,
                documentIdentifier: msg.documentIdentifier,
                ownerType: msg.ownerType,
            }),
        )
    })

    it('should update ownerType into user document if exist', async () => {
        const userIdentifier = randomData.generateUserIdentifier()
        const documentIdentifier = randomData.generateDocumentIdentifier()
        const headers = sessionGenerator.getHeaders()

        const newUserDocument: UserDocument = {
            userIdentifier,
            documentType: DocumentType.DriverLicense,
            documentIdentifier,
            ownerType: OwnerType.owner,
            notifications: {},
        }

        await userDocumentModel.create(newUserDocument)

        const msg: EventPayload = {
            userIdentifier,
            documentType: DocumentType.DriverLicense,
            documentIdentifier,
            ownerType: OwnerType.properUser,
            docId: '123',
            docStatus: DocStatus.Ok,
            headers,
        }

        await addDocumentInProfileEventListener.handler(msg)

        const query: FilterQuery<UserDocumentModel> = {
            userIdentifier: msg.userIdentifier,
            documentType: msg.documentType,
            documentIdentifier: msg.documentIdentifier,
        }

        const storedDocuments: UserDocumentModel[] = await userDocumentModel.find(query)

        expect(storedDocuments).toHaveLength(1)
        expect(storedDocuments[0]).toEqual(
            expect.objectContaining({
                userIdentifier: msg.userIdentifier,
                documentType: msg.documentType,
                documentIdentifier: msg.documentIdentifier,
                ownerType: msg.ownerType,
            }),
        )
    })
})
