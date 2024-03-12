import { ExternalResponseBaseEventPayload } from '.'

export interface EventPayload extends ExternalResponseBaseEventPayload {
    response?: {
        success: boolean
        error?: string
    }
}
