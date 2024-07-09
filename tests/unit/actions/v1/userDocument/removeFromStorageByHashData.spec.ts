import TestKit, { mockInstance } from '@diia-inhouse/test'

import RemoveFromStorageByHashDataAction from '@actions/v1/userDocument/removeFromStorageByHashData'

import UserDocumentStorageService from '@services/userDocumentStorage'

describe(`Action ${RemoveFromStorageByHashDataAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentStorageServiceMock = mockInstance(UserDocumentStorageService)

    const removeFromStorageByHashDataAction = new RemoveFromStorageByHashDataAction(userDocumentStorageServiceMock)

    describe('method `handler`', () => {
        it('should successfully remove from storage hash data', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    documentType: 'local-vaccination-certificate',
                    hashData: 'hashData',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userDocumentStorageServiceMock, 'removeFromStorageByHashData').mockResolvedValueOnce()

            await removeFromStorageByHashDataAction.handler(args)

            expect(userDocumentStorageServiceMock.removeFromStorageByHashData).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.documentType,
                args.params.hashData,
            )
        })
    })
})
