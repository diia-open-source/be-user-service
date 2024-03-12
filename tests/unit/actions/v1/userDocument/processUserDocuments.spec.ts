import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import ProcessUserDocuments from '@actions/v1/userDocument/processUserDocuments'

import UserDocumentService from '@services/userDocument'

describe(`Action ${ProcessUserDocuments.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userActionAccessServiceMock = mockInstance(UserDocumentService)

    const processUserDocuments = new ProcessUserDocuments(userActionAccessServiceMock)

    describe('method `handler`', () => {
        it('should return array of document types', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier', documentTypes: [DocumentType.BirthCertificate] },
                session: testKit.session.getUserSession(),
                headers,
            }

            const mockDocumentTypeArray: [DocumentType, DocumentType][] = [
                [DocumentType.DriverLicense, DocumentType.VehicleLicense],
                [DocumentType.VehicleLicense, DocumentType.DriverLicense],
            ]

            jest.spyOn(userActionAccessServiceMock, 'processUserDocuments').mockResolvedValueOnce(mockDocumentTypeArray)

            expect(await processUserDocuments.handler(args)).toMatchObject(mockDocumentTypeArray)

            expect(userActionAccessServiceMock.processUserDocuments).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.documentTypes,
            )
        })
    })
})
