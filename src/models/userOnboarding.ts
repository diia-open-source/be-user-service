import { Model, Schema, model, models } from 'mongoose'

import { UserOnboarding } from '@interfaces/models/userOnboarding'

const userOnboardingSchema = new Schema<UserOnboarding>(
    {
        mobileUid: { type: String, unique: true, required: true },
        onboardingAppVersion: { type: String, required: true },
    },
    {
        timestamps: true,
    },
)

export default <Model<UserOnboarding>>models.UserOnboarding || model('UserOnboarding', userOnboardingSchema)
