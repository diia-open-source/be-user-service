import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { BadRequestError } from '@diia-inhouse/errors'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { EventPayload } from '@interfaces/externalEventListeners/diiaIdCertificateCreate'
import { SignAlgo } from '@interfaces/models/diiaId'

export default class DiiaIdCertificateCreateEventListener implements EventBusListener {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly event: ExternalEvent = ExternalEvent.DiiaIdCertificateCreate

    readonly validationRules: ValidationSchema = {
        uuid: { type: 'uuid' },
        response: {
            type: 'object',
            optional: true,
            props: {
                certificateSerialNumber: { type: 'string' },
                registryUserIdentifier: { type: 'string' },
                identifier: { type: 'string' },
                creationDate: { type: 'date', convert: true },
                expirationDate: { type: 'date', convert: true },
                signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
            },
        },
        error: {
            type: 'object',
            optional: true,
            props: {
                message: { type: 'string' },
                http_code: { type: 'number' },
            },
        },
    }

    async handler(message: EventPayload): Promise<void> {
        const { response, error } = message
        if (error || !response) {
            throw new BadRequestError('Failed to create certificate', { message })
        }

        await this.diiaIdService.handleCreateCertificateResponse(response)
    }
}
