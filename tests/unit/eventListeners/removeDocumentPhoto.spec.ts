import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import RemoveDocumentPhotoEventListener from '@src/eventListeners/removeDocumentPhoto'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

describe('RemoveDocumentPhotoEventListener', () => {
    const testKit = new TestKit()
    const documentFeaturePointsServiceMock = mockInstance(DocumentFeaturePointsService)
    const removeDocumentPhotoEventListener = new RemoveDocumentPhotoEventListener(documentFeaturePointsServiceMock)

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const message = {
                documentIdentifier: 'document-identifier',
                documentType: DocumentType.BirthCertificate,
                userIdentifier,
            }
            const { documentType, documentIdentifier } = message

            jest.spyOn(documentFeaturePointsServiceMock, 'removeDocumentFeaturePoints').mockResolvedValueOnce()

            expect(await removeDocumentPhotoEventListener.handler(message)).toBeUndefined()

            expect(documentFeaturePointsServiceMock.removeDocumentFeaturePoints).toHaveBeenCalledWith(
                userIdentifier,
                documentType,
                documentIdentifier,
            )
        })
    })
})
