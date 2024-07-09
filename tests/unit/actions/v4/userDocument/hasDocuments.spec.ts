import TestKit, { mockInstance } from '@diia-inhouse/test'
import { OwnerType } from '@diia-inhouse/types'

import HasDocumentsAction from '@actions/v4/userDocument/hasDocuments'

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
                    filters: [
                        [
                            { documentType: 'internal-passport', ownerType: OwnerType.owner },
                            { documentType: 'driver-license', ownerType: OwnerType.owner },
                        ],
                    ],
                },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const result = {
                hasDocuments: true,
                missingDocuments: [],
            }

            jest.spyOn(userDocumentService, 'hasDocumentsByFilters').mockResolvedValueOnce(result)

            expect(await action.handler(args)).toBeTruthy()

            expect(userDocumentService.hasDocumentsByFilters).toHaveBeenCalledWith(args.params.userIdentifier, args.params.filters)
        })
    })
})
