import TestKit, { mockInstance } from '@diia-inhouse/test'

import SaveDocumentTypesOrderAction from '@actions/v2/userDocument/saveDocumentTypesOrder'

import UserDocumentSettingsService from '@services/userDocumentSettings'

describe(`Action ${SaveDocumentTypesOrderAction.name}`, () => {
    const testKit = new TestKit()
    const userDocumentSettingsService = mockInstance(UserDocumentSettingsService)

    const action = new SaveDocumentTypesOrderAction(userDocumentSettingsService, [])

    describe('Method `handler`', () => {
        it('should return true after saved user documents order', async () => {
            const args = {
                params: {
                    documentsOrder: [{ documentType: 'driver-license', order: 1 }],
                },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            jest.spyOn(userDocumentSettingsService, 'saveDocumentsOrder').mockResolvedValueOnce()

            expect(await action.handler(args)).toMatchObject({ success: true })

            expect(userDocumentSettingsService.saveDocumentsOrder).toHaveBeenCalledWith(
                {
                    userIdentifier: args.session.user.identifier,
                    features: args.session.features,
                },
                args.params.documentsOrder,
            )
        })
    })
})
