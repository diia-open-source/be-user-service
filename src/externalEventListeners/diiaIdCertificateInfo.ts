import { EventBusListener } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import { ExternalEvent } from '@interfaces/queue'

export default class DiiaIdCertificateInfoEventListener implements EventBusListener {
    readonly event: ExternalEvent = ExternalEvent.DiiaIdCertificateInfo

    readonly isSync: boolean = true

    readonly validationRules: ValidationSchema = {
        subjDRFOCode: { type: 'string' },
    }
}
