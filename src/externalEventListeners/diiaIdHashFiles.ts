import { EventBusListener } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import { DiiaIdHashFilesResponse } from '@interfaces/externalEventListeners/diiaIdHashFiles'
import { ExternalEvent } from '@interfaces/queue'

export default class DiiaIdHashFilesEventListener implements EventBusListener {
    readonly event: ExternalEvent = ExternalEvent.DiiaIdHashFiles

    readonly isSync: boolean = true

    readonly validationRules: ValidationSchema<DiiaIdHashFilesResponse> = {
        identifier: { type: 'string' },
        hashes: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    name: { type: 'string' },
                    hash: { type: 'string' },
                },
            },
        },
    }
}
