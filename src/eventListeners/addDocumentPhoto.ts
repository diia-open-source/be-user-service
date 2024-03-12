import { EventBusListener, InternalEvent } from '@diia-inhouse/diia-queue'
import { DocumentType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import { EventPayload } from '@interfaces/eventListeners/addDocumentPhoto'

export default class AddDocumentPhotoEventListener implements EventBusListener {
    constructor(private readonly documentFeaturePointsService: DocumentFeaturePointsService) {}

    readonly event: InternalEvent = InternalEvent.DocumentsAddDocumentPhoto

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        documentType: { type: 'string', enum: Object.values(DocumentType) },
        documentIdentifier: { type: 'string' },
        photo: { type: 'string' },
    }

    async handler(message: EventPayload): Promise<void> {
        const { userIdentifier, documentType, documentIdentifier, photo } = message

        await this.documentFeaturePointsService.createDocumentFeaturePointsEntity(userIdentifier, documentType, documentIdentifier, photo)
    }
}
