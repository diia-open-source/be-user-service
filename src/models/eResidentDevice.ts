import { Model, Schema, model, models } from 'mongoose'

import { PlatformType } from '@diia-inhouse/types'

import { EResidentDevice } from '@interfaces/models/eResidentDevice'

const eResidentDeviceSchema = new Schema<EResidentDevice>(
    {
        mobileUid: { type: String, unique: true, required: true },
        userIdentifier: { type: String, index: true },
        platformType: { type: String, enum: Object.values(PlatformType), required: true },
        platformVersion: { type: String, required: true },
    },
    {
        timestamps: true,
    },
)

export const skipSyncIndexes = true

export default <Model<EResidentDevice>>models.EResidentDevice || model('EResidentDevice', eResidentDeviceSchema)
