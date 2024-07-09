import TestKit, { mockInstance } from '@diia-inhouse/test'

import CreateDocumentFeaturePoints from '@actions/v1/userDocument/createDocumentFeaturePoints'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

describe(`Action ${CreateDocumentFeaturePoints.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const documentFeaturePointsServiceMock = mockInstance(DocumentFeaturePointsService)

    const createDocumentFeaturePoints = new CreateDocumentFeaturePoints(documentFeaturePointsServiceMock, [])

    describe('method `handler`', () => {
        it('should return feature points', async () => {
            const args = {
                params: {
                    userIdentifier: testKit.session.getUserSession().user.identifier,
                    documentType: 'birth-certificate',
                    documentIdentifier: 'documentIdentifier',
                    photo: 'photo',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const points = [10, 10]

            jest.spyOn(documentFeaturePointsServiceMock, 'createDocumentFeaturePoints').mockResolvedValueOnce(points)

            expect(await createDocumentFeaturePoints.handler(args)).toMatchObject({ points })

            expect(documentFeaturePointsServiceMock.createDocumentFeaturePoints).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.documentType,
                args.params.documentIdentifier,
                args.params.photo,
            )
        })
    })
})
