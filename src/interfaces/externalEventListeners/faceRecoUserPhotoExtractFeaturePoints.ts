import { ExternalResponseBaseEventPayload } from '.'

export interface EventPayload extends Pick<ExternalResponseBaseEventPayload, 'uuid'> {
    response: {
        feature_points: number[]
    }
}
