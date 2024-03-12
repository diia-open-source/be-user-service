import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType, OwnerType } from '@diia-inhouse/types'

import GetUserDocumentsAction from '@actions/v1/userDocument/getUserDocuments'

import UserDocumentService from '@services/userDocument'

describe(`Action ${GetUserDocumentsAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentServiceMock = mockInstance(UserDocumentService)

    const getUserDocumentsAction = new GetUserDocumentsAction(userDocumentServiceMock)

    describe('method `handler`', () => {
        it('should return user documents', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    documentType: DocumentType.DriverLicense,
                    mobileUid: headers.mobileUid,
                    activeOnly: true,
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const userDocuments = [
                {
                    userIdentifier: 'userIdentifier',
                    documentType: DocumentType.DriverLicense,
                    documentIdentifier: 'documentIdentifier',
                    ownerType: OwnerType.owner,
                    notifications: {},
                },
            ]

            jest.spyOn(userDocumentServiceMock, 'getUserDocuments').mockResolvedValueOnce(userDocuments)

            expect(await getUserDocumentsAction.handler(args)).toMatchObject({ documents: userDocuments })

            expect(userDocumentServiceMock.getUserDocuments).toHaveBeenCalledWith(args.params)
        })
    })
})
