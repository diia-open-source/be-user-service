import { ActHeaders, Gender } from '@diia-inhouse/types'

export interface EventPayload {
    itn: string
    gender: Gender
    birthDay: string
    headers: ActHeaders
}
