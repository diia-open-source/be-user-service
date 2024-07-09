import { Model, Schema, model, models } from '@diia-inhouse/db'
import { Gender } from '@diia-inhouse/types'

import { CitizenshipSource, EResidentProfile, EResidentProfileCitizenship } from '@interfaces/models/eResidentProfile'

const citizenshipSchema = new Schema<EResidentProfileCitizenship>(
    {
        country: { type: String, required: true },
        date: { type: Date, required: true },
        sourceId: { type: String },
    },
    {
        _id: false,
    },
)

const citizenshipBySourceSchema = new Schema<Record<CitizenshipSource, EResidentProfileCitizenship>>(
    {
        [CitizenshipSource.EResidentRegistry]: { type: citizenshipSchema },
    },
    {
        _id: false,
    },
)

const eResidentProfileSchema = new Schema<EResidentProfile>(
    {
        identifier: { type: String, unique: true, required: true },
        gender: { type: String, enum: Object.values(Gender), required: true },
        birthDay: { type: Date, required: true },
        citizenship: { type: citizenshipBySourceSchema },
    },
    {
        timestamps: true,
    },
)

eResidentProfileSchema.index({ gender: 1, birthDay: 1 })
eResidentProfileSchema.index({ birthDay: 1, gender: 1 })

export const skipSyncIndexes = true

export default <Model<EResidentProfile>>models.EResidentProfile || model('EResidentProfile', eResidentProfileSchema)
