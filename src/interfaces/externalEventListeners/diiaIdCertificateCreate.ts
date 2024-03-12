import { ExternalResponseBaseEventPayload } from '.'

import { DiiaIdCreateCertificateResponse } from '@interfaces/services/diiaId'

export interface EventPayload extends ExternalResponseBaseEventPayload {
    response?: DiiaIdCreateCertificateResponse
}
