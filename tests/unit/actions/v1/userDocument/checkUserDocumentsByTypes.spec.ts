import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import CheckUserDocumentsByTypesAction from '@actions/v1/userDocument/checkUserDocumentsByTypes'

import UserDocumentService from '@services/userDocument'

import { VerifiedDocument } from '@interfaces/services/userDocument'

describe(`Action ${CheckUserDocumentsByTypesAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentServiceMock = mockInstance(UserDocumentService)

    const checkUserDocumentsByTypesAction = new CheckUserDocumentsByTypesAction(userDocumentServiceMock)

    describe('method `handler`', () => {
        it('should return verified documents', async () => {
            const args = {
                params: {
                    userIdentifier: testKit.session.getUserSession().user.identifier,
                    documentsToVerify: [
                        {
                            documentType: DocumentType.BirthCertificate,
                            documentIdentifer: 'documentIdentifer',
                        },
                    ],
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const verifiedDocuments: VerifiedDocument[] = []

            jest.spyOn(userDocumentServiceMock, 'verifyUserDocuments').mockResolvedValueOnce(verifiedDocuments)

            expect(await checkUserDocumentsByTypesAction.handler(args)).toMatchObject({ verifiedDocuments })

            expect(userDocumentServiceMock.verifyUserDocuments).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.documentsToVerify,
            )
        })
    })
})
