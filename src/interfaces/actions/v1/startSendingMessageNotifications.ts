import { mongo } from '@diia-inhouse/db'
import { PlatformType, ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        messageId: string
        platformTypes?: PlatformType[]
        useExpirations?: boolean
    }
}

export interface ActionResult {
    distributionId: mongo.ObjectId
}
