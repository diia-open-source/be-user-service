import { randomUUID as uuid } from 'node:crypto'

import TestKit from '@diia-inhouse/test'

import UpdateDocumentVisibilityAction from '@src/actions/v1/userDocument/updateDocumentVisibility'

import userDocumentSettingsModel from '@models/userDocumentSettings'

import { getApp } from '@tests/utils/getApp'

import { DocumentTypeSetting } from '@interfaces/models/userDocumentSettings'

describe(`Action ${UpdateDocumentVisibilityAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let action: UpdateDocumentVisibilityAction
    const testKit = new TestKit()

    beforeAll(async () => {
        app = await getApp()
        action = app.container.build(UpdateDocumentVisibilityAction)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it.each([
        ['defined', false],
        ['undefined', undefined],
    ])('should update document visibility settings when hideDocumentType is %s', async (_s, hideDocumentType) => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const userIdentifier = session.user.identifier

        const hiddenDocuments = [uuid(), uuid()]
        const documentType = 'birth-record'

        const { _id: modelId } = await userDocumentSettingsModel.create({
            userIdentifier,
            [documentType]: {
                documentTypeOrder: 1,
                hiddenDocuments,
            },
        })

        // Act
        await action.handler({
            headers,
            params: {
                userIdentifier,
                documentType,
                unhideDocuments: [hiddenDocuments[1]],
                hideDocuments: [],
                hideDocumentType,
            },
        })

        // Assert
        const userDocumentSettings = await userDocumentSettingsModel.findById(modelId).lean()

        expect(userDocumentSettings?.[documentType]).toEqual<DocumentTypeSetting>({
            documentTypeOrder: 1,
            hiddenDocuments: [hiddenDocuments[0]],
            hiddenDocumentType: hideDocumentType,
        })
    })
})
