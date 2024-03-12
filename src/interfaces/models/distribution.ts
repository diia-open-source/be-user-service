import { ObjectId } from 'bson'
import { Document } from 'mongoose'

import { PlatformType } from '@diia-inhouse/types'

export interface Distribution {
    messageId: ObjectId
    platformTypes: PlatformType[]
}

export interface DistributionModel extends Distribution, Document {}
