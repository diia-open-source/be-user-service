import TestKit, { mockInstance } from '@diia-inhouse/test'

import HasDocumentsAction from '@actions/v2/userDocument/hasDocuments'

import UserDocumentService from '@services/userDocument'

describe(`Action ${HasDocumentsAction.name}`, () => {
    const testKit = new TestKit()
    const userDocumentService = mockInstance(UserDocumentService)

    const action = new HasDocumentsAction(userDocumentService, [])

    describe('Method `handler`', () => {
        it('should return true if user has documents', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    documentTypes: [['internal-passport', 'driver-license'], ['driver-license']],
                },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            jest.spyOn(userDocumentService, 'hasDocuments').mockResolvedValueOnce(true)

            expect(await action.handler(args)).toBeTruthy()

            expect(userDocumentService.hasDocuments).toHaveBeenCalledWith(args.params.userIdentifier, args.params.documentTypes)
        })
    })
})
