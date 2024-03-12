import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import { AppConfig } from '@interfaces/config'
import { EventPayload } from '@interfaces/externalEventListeners/faceRecoUserPhotoExtractFeaturePoints'

export default class FaceRecoUserPhotoExtractFeaturePointsEventListener implements EventBusListener {
    constructor(
        private readonly documentFeaturePointsService: DocumentFeaturePointsService,
        private readonly config: AppConfig,
    ) {}

    readonly event: ExternalEvent = ExternalEvent.FaceRecoUserPhotoExtractFeaturePoints

    readonly validationRules: ValidationSchema = {
        feature_points: {
            type: 'array',
            items: {
                type: 'number',
            },
            length: this.config.faceReco.featurePointsLength,
        },
    }

    readonly isSync: boolean = true

    async handler(message: EventPayload): Promise<void> {
        const {
            uuid: requestId,
            response: { feature_points: featurePoints },
        } = message

        await this.documentFeaturePointsService.attachFeaturePoints(requestId, featurePoints)
    }
}
