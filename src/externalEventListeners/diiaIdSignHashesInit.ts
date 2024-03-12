import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { Logger } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import { EventPayload } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'

export default class DiiaIdSignHashesInitEventListener implements EventBusListener {
    constructor(private readonly logger: Logger) {}

    readonly event: ExternalEvent = ExternalEvent.DiiaIdSignHashesInit

    readonly validationRules: ValidationSchema = {
        uuid: { type: 'uuid' },
        response: {
            type: 'object',
            optional: true,
            props: {
                identifier: { type: 'string' },
                success: { type: 'boolean' },
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
        const { error } = message
        if (error) {
            this.logger.fatal(`Received error response on ${this.event}`, { error })
        }

        return
    }
}
