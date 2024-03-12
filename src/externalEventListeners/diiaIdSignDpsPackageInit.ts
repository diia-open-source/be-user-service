import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

export default class DiiaIdSignDpsPackagePrepareEventListener implements EventBusListener {
    readonly event: ExternalEvent = ExternalEvent.DiiaIdSignDpsPackageInit

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
