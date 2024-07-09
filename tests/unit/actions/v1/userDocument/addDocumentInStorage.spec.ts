import TestKit, { mockInstance } from '@diia-inhouse/test'

import AddDocumentInStorageAction from '@actions/v1/userDocument/addDocumentInStorage'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { UserDocumentStorageModel } from '@interfaces/models/userDocumentStorage'

describe(`Action ${AddDocumentInStorageAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentStorageServiceMock = mockInstance(UserDocumentStorageService)

    const addDocumentInStorageAction = new AddDocumentInStorageAction(userDocumentStorageServiceMock)

    describe('Method `handler`', () => {
        it('should add document to storage', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    mobileUid: headers.mobileUid,
                    hashData: 'hashData',
                    documentType: 'birth-certificate',
                    encryptedData: 'encryptedData',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userDocumentStorageServiceMock, 'addDocument').mockResolvedValueOnce(<UserDocumentStorageModel>{})

            await addDocumentInStorageAction.handler(args)

            expect(userDocumentStorageServiceMock.addDocument).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.hashData,
                args.params.documentType,
                args.params.encryptedData,
                undefined,
                undefined,
                { mobileUid: args.params.mobileUid },
            )
        })
    })
})
