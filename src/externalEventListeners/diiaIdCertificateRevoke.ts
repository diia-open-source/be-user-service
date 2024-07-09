import { EventBusListener } from '@diia-inhouse/diia-queue'
import { BadRequestError } from '@diia-inhouse/errors'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { EventPayload } from '@interfaces/externalEventListeners/diiaIdCertificateRevoke'
import { ExternalEvent } from '@interfaces/queue'

export default class DiiaIdCertificateRevokeEventListener implements EventBusListener {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly event: ExternalEvent = ExternalEvent.DiiaIdCertificateRevoke

    readonly validationRules: ValidationSchema = {
        uuid: { type: 'uuid' },
        response: {
            type: 'object',
            optional: true,
            props: {
                success: { type: 'boolean' },
                error: { type: 'string', optional: true },
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
        const { uuid, response, error: externalError } = message
        if (externalError || !response) {
            throw new BadRequestError('Failed to revoke certificate', { message })
        }

        const { success, error } = response

        return success
            ? await this.diiaIdService.hardDeleteIdentifierByEventUuid(uuid)
            : await this.diiaIdService.handleUnsuccessRevoking(uuid, error)
    }
}
