import TestKit, { mockInstance } from '@diia-inhouse/test'

import HasOneOfDocumentsAction from '@actions/v1/userDocument/hasOneOfDocuments'

import UserDocumentService from '@services/userDocument'

describe(`Action ${HasOneOfDocumentsAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentServiceMock = mockInstance(UserDocumentService)

    const hasOneOfDocumentsAction = new HasOneOfDocumentsAction(userDocumentServiceMock, [])

    describe('method `handler`', () => {
        it('should return true if user has one of given documents', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier', documentTypes: ['taxpayer-card', 'driver-license'] },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userDocumentServiceMock, 'hasOneOfDocuments').mockResolvedValueOnce(true)

            expect(await hasOneOfDocumentsAction.handler(args)).toBeTruthy()

            expect(userDocumentServiceMock.hasOneOfDocuments).toHaveBeenCalledWith(args.params.userIdentifier, args.params.documentTypes)
        })
    })
})
