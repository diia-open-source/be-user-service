import { randomUUID } from 'node:crypto'

import { mockInstance } from '@diia-inhouse/test'

import FaceRecoUserPhotoExtractFeaturePointsEventListener from '@src/externalEventListeners/faceRecoUserPhotoExtractFeaturePoints'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import { AppConfig } from '@interfaces/config'

describe('FaceRecoUserPhotoExtractFeaturePointsEventListener', () => {
    const documentFeaturePointsServiceMock = mockInstance(DocumentFeaturePointsService)
    const config = { faceReco: { featurePointsLength: 10 } }
    const faceRecoUserPhotoExtractFeaturePointsEventListener = new FaceRecoUserPhotoExtractFeaturePointsEventListener(
        documentFeaturePointsServiceMock,
        <AppConfig>config,
    )

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const message = {
                uuid: randomUUID(),
                response: {
                    feature_points: [1, 3, 4, 6],
                },
            }

            const {
                uuid: requestId,
                response: { feature_points: featurePoints },
            } = message

            jest.spyOn(documentFeaturePointsServiceMock, 'attachFeaturePoints').mockResolvedValueOnce()

            expect(await faceRecoUserPhotoExtractFeaturePointsEventListener.handler(message)).toBeUndefined()

            expect(documentFeaturePointsServiceMock.attachFeaturePoints).toHaveBeenCalledWith(requestId, featurePoints)
        })
    })
})
