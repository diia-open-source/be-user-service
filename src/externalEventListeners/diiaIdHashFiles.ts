import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

export default class DiiaIdHashFilesEventListener implements EventBusListener {
    readonly event: ExternalEvent = ExternalEvent.DiiaIdHashFiles

    readonly isSync: boolean = true

    readonly validationRules: ValidationSchema = {
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
