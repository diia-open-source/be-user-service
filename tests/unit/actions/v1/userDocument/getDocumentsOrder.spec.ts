import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDocumentsOrderAction from '@actions/v1/userDocument/getDocumentsOrder'

import UserDocumentSettingsService from '@services/userDocumentSettings'

describe(`Action ${GetDocumentsOrderAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentServiceMock = mockInstance(UserDocumentSettingsService)

    const getDocumentsOrderAction = new GetDocumentsOrderAction(userDocumentServiceMock)

    describe('method `handler`', () => {
        it('should return user documents order response', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    features: {},
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const userDocumentsOrderResponse = [{ documentType: 'foreign-passport' }]

            jest.spyOn(userDocumentServiceMock, 'getDocumentsOrder').mockResolvedValueOnce(userDocumentsOrderResponse)

            expect(await getDocumentsOrderAction.handler(args)).toMatchObject(userDocumentsOrderResponse)

            expect(userDocumentServiceMock.getDocumentsOrder).toHaveBeenCalledWith(args.params)
        })
    })
})
