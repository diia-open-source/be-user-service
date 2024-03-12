import { Gender } from '@diia-inhouse/types'

export interface EventPayload {
    userIdentifier: string
    fName: string
    lName: string
    mName: string
    birthDay: string
    gender: Gender
    koatuu?: string
    communityKodificatorCode?: string
}
