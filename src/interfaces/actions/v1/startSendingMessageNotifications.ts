import { ObjectId } from 'bson'

import { PlatformType, ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        messageId: ObjectId
        platformTypes?: PlatformType[]
        useExpirations?: boolean
    }
}

export interface ActionResult {
    distributionId: ObjectId
}
