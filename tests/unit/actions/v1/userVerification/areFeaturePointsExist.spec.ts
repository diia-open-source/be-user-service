import TestKit, { mockInstance } from '@diia-inhouse/test'

import AreFeaturePointsExistAction from '@actions/v1/userVerification/areFeaturePointsExist'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

describe(`Action ${AreFeaturePointsExistAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const documentFeaturePointsServiceMock = mockInstance(DocumentFeaturePointsService)

    const areFeaturePointsExistAction = new AreFeaturePointsExistAction(documentFeaturePointsServiceMock)

    describe('method `handler`', () => {
        it('should return true when subscription is added', async () => {
            const args = {
                params: { userIdentifier: testKit.session.getUserSession().user.identifier },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(documentFeaturePointsServiceMock, 'areFeaturePointsExistByUserIdentifier').mockResolvedValueOnce(true)

            expect(await areFeaturePointsExistAction.handler(args)).toBe(true)

            expect(documentFeaturePointsServiceMock.areFeaturePointsExistByUserIdentifier).toHaveBeenCalledWith(args.params.userIdentifier)
        })
    })
})
