import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDecryptedDataFromStorageAction from '@actions/v1/userDocument/getDecryptedDataFromStorage'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { DecryptedDocument, DecryptedDocuments } from '@interfaces/services/userDocumentStorage'

describe(`Action ${GetDecryptedDataFromStorageAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentStorageServiceMock = mockInstance(UserDocumentStorageService)

    const getDecryptedDataFromStorageAction = new GetDecryptedDataFromStorageAction(userDocumentStorageServiceMock)

    describe('method `handler`', () => {
        it('should return decrypted documents', async () => {
            const args = {
                params: {
                    userIdentifier: testKit.session.getUserSession().user.identifier,
                    mobileUid: headers.mobileUid,
                    documentTypes: ['birth-certificate', 'driver-license'],
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const mockDecryptedDocument: DecryptedDocument = {
                photo: 'photo-data',
                docPhoto: 'doc-photo-data',
            }

            const mockDecryptedDocuments: DecryptedDocuments = {
                'internal-passport': [mockDecryptedDocument],
                'driver-license': [mockDecryptedDocument],
            }

            jest.spyOn(userDocumentStorageServiceMock, 'getDecryptedDataFromStorage').mockResolvedValueOnce(mockDecryptedDocuments)

            expect(await getDecryptedDataFromStorageAction.handler(args)).toMatchObject(mockDecryptedDocuments)

            expect(userDocumentStorageServiceMock.getDecryptedDataFromStorage).toHaveBeenCalledWith(args.params.userIdentifier, {
                documentTypes: args.params.documentTypes,
                mobileUid: args.headers.mobileUid,
            })
        })
    })
})
