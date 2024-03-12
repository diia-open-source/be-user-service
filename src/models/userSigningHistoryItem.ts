import { Model, Schema, model, models } from 'mongoose'

import { SignAlgo } from '@interfaces/models/diiaId'
import {
    SigningHistoryAcquirer,
    SigningHistoryOffer,
    SigningHistoryRecipient,
    StatusHistoryItem,
    UserSigningHistoryItem,
} from '@interfaces/models/userSigningHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

const statusHistoryItemSchema = new Schema<StatusHistoryItem>(
    {
        status: { type: String, enum: Object.values(UserHistoryItemStatus), required: true },
        date: { type: Date, required: true },
    },
    {
        _id: false,
    },
)

const acquirerSchema = new Schema<SigningHistoryAcquirer>(
    {
        id: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        address: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const offerSchema = new Schema<SigningHistoryOffer>(
    {
        hashId: { type: String, required: true },
        name: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const recipientSchema = new Schema<SigningHistoryRecipient>(
    {
        name: { type: String, required: true },
        address: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const userSigningHistoryItemSchema = new Schema<UserSigningHistoryItem>(
    {
        userIdentifier: { type: String, index: true, required: true },
        sessionId: { type: String, index: true, required: true },
        resourceId: { type: String, required: true },
        platformType: { type: String },
        platformVersion: { type: String },
        action: { type: String },
        status: { type: String, enum: Object.values(UserHistoryItemStatus), index: true, required: true },
        statusHistory: { type: [statusHistoryItemSchema], required: true },
        documents: { type: [String], required: true },
        date: { type: Date, required: true },
        acquirer: { type: acquirerSchema },
        offer: { type: offerSchema },
        recipient: { type: recipientSchema },
        publicService: { type: String },
        applicationId: { type: String, index: true },
        signAlgo: { type: String, enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
        noSigningTime: { type: Boolean },
        noContentTimestamp: { type: Boolean },
    },
    {
        timestamps: true,
    },
)

// userSigningHistoryItemSchema.index({ resourceId: 1, userIdentifier: 1 }, { unique: true })

export const skipSyncIndexes = true

export default <Model<UserSigningHistoryItem>>models.UserSigningHistoryItem || model('UserSigningHistoryItem', userSigningHistoryItemSchema)
