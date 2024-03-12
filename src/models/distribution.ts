import { Model, Schema, model, models } from 'mongoose'

import { PlatformType } from '@diia-inhouse/types'

import { Distribution } from '@interfaces/models/distribution'

const distributionSchema = new Schema<Distribution>(
    {
        messageId: { type: Schema.Types.ObjectId, unique: true, required: true },
        platformTypes: { type: [String], enum: Object.values(PlatformType), default: [], required: true },
    },
    {
        timestamps: true,
    },
)

export const skipSyncIndexes = true

export default <Model<Distribution>>models.Distribution || model('Distribution', distributionSchema)
