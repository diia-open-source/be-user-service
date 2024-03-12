import { Model, Schema, model, models } from 'mongoose'

import { DocumentType } from '@diia-inhouse/types'

import { UserDocumentStorage } from '@interfaces/models/userDocumentStorage'

const userDocumentStorageSchema = new Schema<UserDocumentStorage>(
    {
        userIdentifier: { type: String, required: true },
        mobileUid: { type: String, index: true, optional: true },
        hashData: { type: String, required: true },
        documentType: { type: String, enum: Object.values(DocumentType), index: true, required: true },
        encryptedData: { type: String, required: true },
        encryptedPhoto: { type: String },
        encryptedDocPhoto: { type: String },
    },
    {
        timestamps: true,
    },
)

userDocumentStorageSchema.index({ userIdentifier: 1, mobileUid: 1, hashData: 1, documentType: 1 }, { unique: true })

export default <Model<UserDocumentStorage>>models.UserDocumentStorage || model('UserDocumentStorage', userDocumentStorageSchema)
