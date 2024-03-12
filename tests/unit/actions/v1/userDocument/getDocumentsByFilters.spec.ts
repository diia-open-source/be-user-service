import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType, OwnerType } from '@diia-inhouse/types'

import GetDocumentsByFilters from '@actions/v1/userDocument/getDocumentsByFilters'

import UserDocumentService from '@services/userDocument'

describe(`Action ${GetDocumentsByFilters.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentServiceMock = mockInstance(UserDocumentService)

    const getDocumentsByFilters = new GetDocumentsByFilters(userDocumentServiceMock)

    describe('method `handler`', () => {
        it('should return documents by filter', async () => {
            const args = {
                params: {
                    filters: [
                        {
                            documentType: DocumentType.DriverLicense,
                            documentIdentifier: 'documentIdentifier',
                            docStatus: [1, 2],
                            ownerType: OwnerType.owner,
                            docId: 'docId',
                        },
                    ],
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const documents = [
                {
                    userIdentifier: testKit.session.getUserSession().user.identifier,
                    documentType: DocumentType.DriverLicense,
                    documentIdentifier: 'documentIdentifier',
                    ownerType: OwnerType.owner,
                    notifications: {},
                },
            ]

            jest.spyOn(userDocumentServiceMock, 'getDocumentsByFilters').mockResolvedValueOnce(documents)

            expect(await getDocumentsByFilters.handler(args)).toMatchObject({ documents })

            expect(userDocumentServiceMock.getDocumentsByFilters).toHaveBeenCalledWith(args.params.filters)
        })
    })
})
