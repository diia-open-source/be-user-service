import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import RemoveBirthCertificateAction from '@actions/v1/userDocument/removeBirthCertificate'

import UserDocumentStorageService from '@services/userDocumentStorage'

describe(`Action ${RemoveBirthCertificateAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentStorageServiceMock = mockInstance(UserDocumentStorageService)

    const removeBirthCertificateAction = new RemoveBirthCertificateAction(userDocumentStorageServiceMock)

    describe('method `handler`', () => {
        it('should successfully remove birth certificate', async () => {
            const args = {
                params: { documentType: DocumentType.BirthCertificate, documentId: 'documentId' },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userDocumentStorageServiceMock, 'removeFromStorageById').mockResolvedValueOnce()

            expect(await removeBirthCertificateAction.handler(args)).toMatchObject({ success: true })

            expect(userDocumentStorageServiceMock.removeFromStorageById).toHaveBeenCalledWith(
                args.session.user.identifier,
                args.params.documentType,
                args.params.documentId,
            )
        })
    })
})
