import { ExternalResponseBaseEventPayload } from '@interfaces/externalEventListeners/index'
import { DiiaOfficeProfile, DiiaOfficeStatus } from '@interfaces/models/userProfile'

export interface EventPayload extends ExternalResponseBaseEventPayload {
    response: {
        rnokpp: string
        status: DiiaOfficeStatus
        profile?: Omit<DiiaOfficeProfile, 'status'>
    }
}
