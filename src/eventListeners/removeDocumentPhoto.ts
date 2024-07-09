import { EventBusListener } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import { EventPayload } from '@interfaces/eventListeners/removeDocumentPhoto'
import { InternalEvent } from '@interfaces/queue'

export default class RemoveDocumentPhotoEventListener implements EventBusListener {
    constructor(
        private readonly documentFeaturePointsService: DocumentFeaturePointsService,
        private readonly documentTypes: string[],
    ) {
        this.validationRules = {
            userIdentifier: { type: 'string' },
            documentType: { type: 'string', enum: this.documentTypes },
            documentIdentifier: { type: 'string' },
        }
    }

    readonly event: InternalEvent = InternalEvent.DocumentsRemoveDocumentPhoto

    readonly validationRules: ValidationSchema

    async handler(message: EventPayload): Promise<void> {
        const { userIdentifier, documentType, documentIdentifier } = message

        await this.documentFeaturePointsService.removeDocumentFeaturePoints(userIdentifier, documentType, documentIdentifier)
    }
}
