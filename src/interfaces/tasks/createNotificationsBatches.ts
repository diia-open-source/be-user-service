import { ObjectId } from 'mongodb'

import { PlatformType } from '@diia-inhouse/types'

export interface EventPayload {
    messageId: ObjectId
    platformTypes: PlatformType[]
    useExpirations: boolean
}
