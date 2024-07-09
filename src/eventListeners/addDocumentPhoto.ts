import { EventBusListener } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import { EventPayload } from '@interfaces/eventListeners/addDocumentPhoto'
import { InternalEvent } from '@interfaces/queue'

export default class AddDocumentPhotoEventListener implements EventBusListener {
    constructor(
        private readonly documentFeaturePointsService: DocumentFeaturePointsService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            userIdentifier: { type: 'string' },
            documentType: { type: 'string', enum: this.documentTypes },
            documentIdentifier: { type: 'string' },
            photo: { type: 'string' },
        }
    }

    readonly event: InternalEvent = InternalEvent.DocumentsAddDocumentPhoto

    readonly validationRules: ValidationSchema

    async handler(message: EventPayload): Promise<void> {
        const { userIdentifier, documentType, documentIdentifier, photo } = message

        await this.documentFeaturePointsService.createDocumentFeaturePointsEntity(userIdentifier, documentType, documentIdentifier, photo)
    }
}
