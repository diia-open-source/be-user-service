import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import AddDocumentPhotoEventListener from '@src/eventListeners/addDocumentPhoto'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import { EventPayload } from '@interfaces/eventListeners/addDocumentPhoto'

describe('AddDocumentPhotoEventListener', () => {
    const testKit = new TestKit()
    const documentFeaturePointsServiceMock = mockInstance(DocumentFeaturePointsService)
    const addDocumentPhotoEventListener = new AddDocumentPhotoEventListener(documentFeaturePointsServiceMock)

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const message: EventPayload = {
                documentIdentifier: 'document-identifier',
                documentType: DocumentType.BirthCertificate,
                photo: 'photo-base64',
                userIdentifier,
            }
            const { documentType, documentIdentifier, photo } = message

            jest.spyOn(documentFeaturePointsServiceMock, 'createDocumentFeaturePointsEntity').mockResolvedValueOnce()

            expect(await addDocumentPhotoEventListener.handler(message)).toBeUndefined()

            expect(documentFeaturePointsServiceMock.createDocumentFeaturePointsEntity).toHaveBeenCalledWith(
                userIdentifier,
                documentType,
                documentIdentifier,
                photo,
            )
        })
    })
})
