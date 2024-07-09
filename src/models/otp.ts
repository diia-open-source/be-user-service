import { Model, Schema, model, models } from '@diia-inhouse/db'

import { Otp } from '@interfaces/models/otp'

const otpSchema = new Schema<Otp>(
    {
        value: { type: Number, index: true, required: true },
        expirationDate: { type: Date, required: true },
        userIdentifier: { type: String, index: true, required: true },
        mobileUid: { type: String, index: true, required: true },
        isDeleted: { type: Boolean, required: true },
        usedDate: { type: Date },
        verifyAttempt: { type: Number, required: true },
    },
    {
        timestamps: true,
    },
)

export default <Model<Otp>>models.Otp || model('Otp', otpSchema)
