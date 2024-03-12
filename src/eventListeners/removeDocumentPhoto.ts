import { EventBusListener, InternalEvent } from '@diia-inhouse/diia-queue'
import { DocumentType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import { EventPayload } from '@interfaces/eventListeners/removeDocumentPhoto'

export default class RemoveDocumentPhotoEventListener implements EventBusListener {
    constructor(private readonly documentFeaturePointsService: DocumentFeaturePointsService) {}

    readonly event: InternalEvent = InternalEvent.DocumentsRemoveDocumentPhoto

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        documentType: { type: 'string', enum: Object.values(DocumentType) },
        documentIdentifier: { type: 'string' },
    }

    async handler(message: EventPayload): Promise<void> {
        const { userIdentifier, documentType, documentIdentifier } = message

        await this.documentFeaturePointsService.removeDocumentFeaturePoints(userIdentifier, documentType, documentIdentifier)
    }
}
