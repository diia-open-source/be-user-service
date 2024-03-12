import { Model, Schema, model, models } from 'mongoose'

import { DiiaId, DiiaIdRevoking, SignAlgo } from '@interfaces/models/diiaId'
import { IdentityDocumentType } from '@interfaces/services/documents'

const revokingSchema = new Schema<DiiaIdRevoking>(
    {
        eventUuid: { type: String, unique: true, sparse: true, required: true },
        error: { type: String },
    },
    {
        _id: false,
    },
)

const diiaIdSchema = new Schema<DiiaId>(
    {
        userIdentifier: { type: String, index: true, required: true },
        mobileUid: { type: String, index: true, required: true },
        identifier: { type: String, unique: true, required: true },
        creationDate: { type: Date },
        expirationDate: { type: Date },
        isDeleted: { type: Boolean, required: true },
        deletedAt: { type: Date },
        revoking: { type: revokingSchema },
        identityDocumentType: { type: String, enum: Object.values(IdentityDocumentType) },
        signAlgo: { type: String, enum: Object.values(SignAlgo) },
        registryUserIdentifier: { type: String, index: true },
        certificateSerialNumber: { type: String },
    },
    {
        timestamps: true,
    },
)

export default <Model<DiiaId>>models.DiiaId || model('DiiaId', diiaIdSchema)
