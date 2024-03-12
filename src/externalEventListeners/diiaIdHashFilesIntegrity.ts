import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

export default class DiiaIdHashFilesIntegrityEventListener implements EventBusListener {
    readonly event: ExternalEvent = ExternalEvent.DiiaIdHashFilesIntegrity

    readonly isSync: boolean = true

    readonly validationRules: ValidationSchema = {
        identifier: { type: 'string' },
        checkResults: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    name: { type: 'string' },
                    checked: { type: 'boolean' },
                },
            },
        },
    }
}
