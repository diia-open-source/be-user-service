import { Schema } from '@diia-inhouse/db'

import { OnboardingBoard, OnboardingButtonAction } from '@interfaces/models/onboarding'

const boardListItemSchema = new Schema(
    {
        text: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const boardListSchema = new Schema(
    {
        bullet: { type: String, required: true },
        items: { type: [boardListItemSchema], required: true },
    },
    {
        _id: false,
    },
)

const boardFooterButtonSchema = new Schema(
    {
        label: { type: String, required: true },
        action: { type: String, enum: Object.values(OnboardingButtonAction), required: true },
    },
    {
        _id: false,
    },
)

const boardFooterSchema = new Schema(
    {
        backgroundColor: { type: String, required: true },
        button: { type: boardFooterButtonSchema, required: true },
    },
    {
        _id: false,
    },
)

export const boardSchema = new Schema<OnboardingBoard>(
    {
        title: { type: String, required: true },
        backgroundColor: { type: String, required: true },
        text: { type: String },
        image: { type: String },
        list: { type: boardListSchema },
        footer: { type: boardFooterSchema, required: true },
    },
    {
        _id: false,
    },
)
