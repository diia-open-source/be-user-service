import { Model, Schema, model, models } from 'mongoose'

import { DocumentType } from '@diia-inhouse/types'

import {
    SharingHistoryAcquirer,
    SharingHistoryOffer,
    StatusHistoryItem,
    UserSharingHistoryItem,
} from '@interfaces/models/userSharingHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

const acquirerSchema = new Schema<SharingHistoryAcquirer>(
    {
        id: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        address: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const offerSchema = new Schema<SharingHistoryOffer>(
    {
        hashId: { type: String, required: true },
        name: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const statusHistoryItemSchema = new Schema<StatusHistoryItem>(
    {
        status: { type: String, enum: Object.values(UserHistoryItemStatus), required: true },
        date: { type: Date, required: true },
    },
    {
        _id: false,
    },
)

const userSharingHistoryItemSchema = new Schema<UserSharingHistoryItem>(
    {
        userIdentifier: { type: String, index: true, required: true },
        sessionId: { type: String, index: true, required: true },
        sharingId: { type: String, unique: true, required: true },
        status: { type: String, enum: Object.values(UserHistoryItemStatus), index: true, required: true },
        statusHistory: { type: [statusHistoryItemSchema], required: true },
        documents: { type: [String], enum: Object.values(DocumentType), required: true },
        date: { type: Date, required: true },
        acquirer: { type: acquirerSchema, required: true },
        offer: { type: offerSchema },
    },
    {
        timestamps: true,
    },
)

export default <Model<UserSharingHistoryItem>>models.UserSharingHistoryItem || model('UserSharingHistoryItem', userSharingHistoryItemSchema)
