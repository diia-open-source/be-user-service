import TestKit, { mockInstance } from '@diia-inhouse/test'

import CheckDocumentsFeaturePointsAction from '@actions/v1/userVerification/checkDocumentsFeaturePoints'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

describe(`Action ${CheckDocumentsFeaturePointsAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const documentFeaturePointsServiceMock = mockInstance(DocumentFeaturePointsService)

    const checkDocumentsFeaturePointsAction = new CheckDocumentsFeaturePointsAction(documentFeaturePointsServiceMock)

    describe('method `handler`', () => {
        it('should return documents after checking feature points', async () => {
            const args = {
                params: { userIdentifier: testKit.session.getUserSession().user.identifier },
                session: testKit.session.getUserSession(),
                headers,
            }

            const checkPointsResult = [
                {
                    documentType: 'internal-passport',
                    documentIdentifier: 'documentIdentifier',
                },
            ]

            jest.spyOn(documentFeaturePointsServiceMock, 'checkDocumentsFeaturePoints').mockResolvedValueOnce(checkPointsResult)

            expect(await checkDocumentsFeaturePointsAction.handler(args)).toMatchObject({ documents: checkPointsResult })

            expect(documentFeaturePointsServiceMock.checkDocumentsFeaturePoints).toHaveBeenCalledWith(args.params.userIdentifier)
        })
    })
})
