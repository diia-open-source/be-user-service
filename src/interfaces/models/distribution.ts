import { Document, mongo } from '@diia-inhouse/db'
import { PlatformType } from '@diia-inhouse/types'

export interface Distribution {
    messageId: mongo.ObjectId
    platformTypes: PlatformType[]
}

export interface DistributionModel extends Distribution, Document {}
