import { EventBusListener } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import { DiiaIdHashFileResponse } from '@interfaces/externalEventListeners/diiaIdHashFile'
import { ExternalEvent } from '@interfaces/queue'

export default class DiiaIdHashFileEventListener implements EventBusListener {
    readonly event: ExternalEvent = ExternalEvent.DiiaIdHashFile

    readonly isSync: boolean = true

    readonly validationRules: ValidationSchema<DiiaIdHashFileResponse> = {
        processId: { type: 'string' },
        hash: {
            type: 'object',
            props: {
                name: { type: 'string' },
                hash: { type: 'string' },
            },
        },
    }
}
