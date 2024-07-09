import TestKit, { mockInstance } from '@diia-inhouse/test'

import SaveDocumentsOrderByDocumentTypeAction from '@actions/v1/userDocument/saveDocumentsOrderByDocumentType'

import UserDocumentSettingsService from '@services/userDocumentSettings'

describe(`Action ${SaveDocumentsOrderByDocumentTypeAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentStorageServiceMock = mockInstance(UserDocumentSettingsService)

    const saveDocumentsOrderByDocumentTypeAction = new SaveDocumentsOrderByDocumentTypeAction(userDocumentStorageServiceMock, [])

    describe('method `handler`', () => {
        it('should return true if saved documents order by document type', async () => {
            const args = {
                params: {
                    documentType: 'internal-passport',
                    documentsOrder: [
                        {
                            docNumber: 'docNumber',
                            order: 1,
                        },
                        {
                            docNumber: 'docNumber 2',
                            order: 2,
                        },
                    ],
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userDocumentStorageServiceMock, 'saveDocumentsOrderByDocumentType').mockResolvedValueOnce()

            expect(await saveDocumentsOrderByDocumentTypeAction.handler(args)).toMatchObject({ success: true })

            expect(userDocumentStorageServiceMock.saveDocumentsOrderByDocumentType).toHaveBeenCalledWith(
                { userIdentifier: args.session.user.identifier },
                args.params.documentType,
                args.params.documentsOrder,
            )
        })
    })
})
