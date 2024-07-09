import TestKit, { mockInstance } from '@diia-inhouse/test'

import ProcessUserDocuments from '@actions/v1/userDocument/processUserDocuments'

import UserDocumentService from '@services/userDocument'

describe(`Action ${ProcessUserDocuments.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userActionAccessServiceMock = mockInstance(UserDocumentService)

    const processUserDocuments = new ProcessUserDocuments(userActionAccessServiceMock, [])

    describe('method `handler`', () => {
        it('should return array of document types', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier', documentTypes: ['birth-certificate'] },
                session: testKit.session.getUserSession(),
                headers,
            }

            const mockDocumentTypeArray: [string, string][] = [
                ['driver-license', 'vehicle-license'],
                ['vehicle-license', 'driver-license'],
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
