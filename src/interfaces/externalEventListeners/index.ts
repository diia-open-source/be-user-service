import { HttpStatusCode } from '@diia-inhouse/types'

export interface ExternalResponseEventError {
    message: string
    http_code: HttpStatusCode
}

export interface ExternalResponseBaseEventPayload {
    uuid: string
    error?: ExternalResponseEventError
}
