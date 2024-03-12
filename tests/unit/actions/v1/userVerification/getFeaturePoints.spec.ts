import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import GetFeaturePointsAction from '@actions/v1/userVerification/getFeaturePoints'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

describe(`Action ${GetFeaturePointsAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const documentFeaturePointsServiceMock = mockInstance(DocumentFeaturePointsService)

    const getFeaturePointsAction = new GetFeaturePointsAction(documentFeaturePointsServiceMock)

    describe('method `handler`', () => {
        it('should return feature points', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier' },
                session: testKit.session.getUserSession(),
                headers,
            }

            const featurePoints = [{ documentType: DocumentType.EResidency, documentIdentifier: 'documentIdentifier', points: [10, 10] }]

            jest.spyOn(documentFeaturePointsServiceMock, 'getFeaturePoints').mockResolvedValueOnce(featurePoints)

            expect(await getFeaturePointsAction.handler(args)).toMatchObject({ points: featurePoints })

            expect(documentFeaturePointsServiceMock.getFeaturePoints).toHaveBeenCalledWith(args.params.userIdentifier)
        })
    })
})
