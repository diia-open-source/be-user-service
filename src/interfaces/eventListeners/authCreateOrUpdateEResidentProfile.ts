import { ActHeaders, Gender } from '@diia-inhouse/types'

export interface EventPayload {
    userIdentifier: string
    gender: Gender
    birthDay: string
    headers: ActHeaders
}
