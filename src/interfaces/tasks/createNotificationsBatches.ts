import { mongo } from '@diia-inhouse/db'
import { PlatformType } from '@diia-inhouse/types'

export interface EventPayload {
    messageId: mongo.ObjectId
    platformTypes: PlatformType[]
    useExpirations: boolean
}
