import TestKit, { mockInstance } from '@diia-inhouse/test'

import SaveDocumentTypesOrderAction from '@actions/v1/userDocument/saveDocumentTypesOrder'

import UserDocumentSettingsService from '@services/userDocumentSettings'

describe(`Action ${SaveDocumentTypesOrderAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentStorageServiceMock = mockInstance(UserDocumentSettingsService)

    const saveDocumentTypesOrderAction = new SaveDocumentTypesOrderAction(userDocumentStorageServiceMock, [])

    describe('method `handler`', () => {
        it('should return true if saved documents order', async () => {
            const args = {
                params: {
                    documentsOrder: [
                        {
                            documentType: 'foreign-passport',
                            order: 1,
                        },
                        {
                            documentType: 'driver-license',
                            order: 2,
                        },
                    ],
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userDocumentStorageServiceMock, 'saveDocumentsOrder').mockResolvedValueOnce()

            expect(await saveDocumentTypesOrderAction.handler(args)).toMatchObject({ success: true })

            expect(userDocumentStorageServiceMock.saveDocumentsOrder).toHaveBeenCalledWith(
                { userIdentifier: args.session.user.identifier },
                args.params.documentsOrder,
            )
        })
    })
})
