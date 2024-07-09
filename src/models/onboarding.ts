import { Model, Schema, model, models } from '@diia-inhouse/db'
import { PlatformType } from '@diia-inhouse/types'

import { boardSchema } from './schemas/board'

import { Onboarding, OnboardingData } from '@interfaces/models/onboarding'

const headerSchema = new Schema<OnboardingData['header']>(
    {
        logo: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const onboardingDataSchema = new Schema<OnboardingData>(
    {
        header: { type: headerSchema, required: true },
        boards: { type: [boardSchema], required: true },
    },
    {
        _id: false,
    },
)

const onboardingSchema = new Schema<Onboarding>(
    {
        appVersion: { type: String, required: true },
        platformType: { type: String, enum: Object.values(PlatformType), required: true },
        isVisible: { type: Boolean, required: true },
        data: { type: onboardingDataSchema, required: true },
        sessionType: { type: String, required: true },
    },
    {
        timestamps: true,
    },
)

onboardingSchema.index(
    {
        sessionType: 1,
        appVersion: 1,
        platformType: 1,
    },
    {
        unique: true,
    },
)

export default <Model<Onboarding>>models.Onboarding || model('Onboarding', onboardingSchema)
