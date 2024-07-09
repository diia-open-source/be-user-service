import { randomUUID as uuid } from 'node:crypto'

import TestKit from '@diia-inhouse/test'

import GetUserDocumentSettingsAction from '@src/actions/v1/userDocument/getUserDocumentSettings'
import { DocumentVisibilitySettingsItem } from '@src/generated'

import DocumentsService from '@services/documents'

import userDocumentSettingsModel from '@models/userDocumentSettings'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/userDocument/getUserDocumentSettings'

describe(`Action GetUserDocumentSettingsAction`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getUserDocumentSettingsAction: GetUserDocumentSettingsAction
    let documentsService: DocumentsService
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()
        getUserDocumentSettingsAction = app.container.build(GetUserDocumentSettingsAction)
        documentsService = app.container.resolve('documentsService')
        testKit = app.container.resolve('testKit')
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return document settings when exist in db', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const userIdentifier = session.user.identifier

        const hiddenDocuments = [uuid(), uuid()]

        await userDocumentSettingsModel.create({
            userIdentifier,
            'birth-record': {
                documentTypeOrder: 0,
                hiddenDocuments,
            },
        })
        jest.spyOn(documentsService, 'getSortedByDefaultDocumentTypes')
            .mockResolvedValueOnce({ sortedDocumentTypes: { User: { items: ['birth-record'] } } })
            .mockResolvedValueOnce({ sortedDocumentTypes: { User: { items: ['birth-record'] } } })

        // Act
        const result = await getUserDocumentSettingsAction.handler({
            headers,
            params: { userIdentifier, features: [], documentsDefaultOrder: {} },
        })

        // Assert
        expect(result).toEqual<ActionResult>({
            documentOrderSettings: [
                {
                    documentIdentifiers: [],
                    documentType: 'birth-record',
                },
            ],
            documentVisibilitySettings: expect.arrayContaining<DocumentVisibilitySettingsItem>([
                {
                    documentType: 'birth-record',
                    hiddenDocuments,
                    hiddenDocumentType: undefined,
                },
            ]),
        })
    })

    it('should return document settings and avoid documents service call if documentsDefaultOrder passed in params', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const userIdentifier = session.user.identifier

        const hiddenDocuments = [uuid(), uuid()]

        await userDocumentSettingsModel.create({
            userIdentifier,
            'birth-record': {
                documentTypeOrder: 0,
                hiddenDocuments,
            },
        })

        // Act
        const result = await getUserDocumentSettingsAction.handler({
            headers,
            params: {
                userIdentifier,
                features: [],
                documentsDefaultOrder: { User: { items: ['birth-record'] } },
            },
        })

        // Assert
        expect(result).toEqual<ActionResult>({
            documentOrderSettings: [
                {
                    documentIdentifiers: [],
                    documentType: 'birth-record',
                },
            ],
            documentVisibilitySettings: expect.arrayContaining<DocumentVisibilitySettingsItem>([
                {
                    documentType: 'birth-record',
                    hiddenDocuments,
                    hiddenDocumentType: undefined,
                },
            ]),
        })
    })
})
