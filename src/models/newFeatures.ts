import { Model, Schema, model, models } from 'mongoose'

import { PlatformType } from '@diia-inhouse/types'

import { boardSchema } from './schemas/board'

import { NewFeatures, NewFeaturesData } from '@interfaces/models/newFeatures'

const headerSchema = new Schema<NewFeaturesData['header']>(
    {
        logo: { type: String, required: true },
        title: { type: String, required: true },
        subTitle: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const newFeaturesDataSchema = new Schema<NewFeaturesData>(
    {
        header: { type: headerSchema, required: true },
        boards: { type: [boardSchema], required: true },
    },
    {
        _id: false,
    },
)

const newFeaturesSchema = new Schema<NewFeatures>(
    {
        appVersion: { type: String, required: true },
        platformType: { type: String, enum: Object.values(PlatformType), required: true },
        isVisible: { type: Boolean, required: true },
        viewsCount: { type: Number, required: true },
        data: { type: newFeaturesDataSchema, required: true },
        sessionType: { type: String, required: true },
    },
    {
        timestamps: true,
    },
)

newFeaturesSchema.index(
    {
        sessionType: 1,
        appVersion: 1,
        platformType: 1,
    },
    {
        unique: true,
    },
)

export default <Model<NewFeatures>>models.NewFeatures || model('NewFeatures', newFeaturesSchema)
