import { Model, Schema, SchemaDefinition, model, models } from 'mongoose'

import { DocumentType, OwnerType } from '@diia-inhouse/types'

import { UserDocument, UserDocumentsNotifications } from '@interfaces/models/userDocument'
import { ComparedTo, UserCompoundDocument } from '@interfaces/services/documents'
import { MessageTemplateCode } from '@interfaces/services/notification'

const notificationsSchemaDefinition: SchemaDefinition<UserDocumentsNotifications> = {}

Object.values(MessageTemplateCode).forEach((value: MessageTemplateCode) => {
    notificationsSchemaDefinition[value] = { type: Date }
})

const notificationsSchema = new Schema<UserDocumentsNotifications>(notificationsSchemaDefinition, { _id: false })

const userCompoundDocumentSchema = new Schema<UserCompoundDocument>(
    {
        documentType: { type: String, enum: Object.values(DocumentType), required: true },
        documentIdentifier: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const comparedToSchema = new Schema<ComparedTo>(
    {
        documentType: { type: String, enum: Object.values(DocumentType), required: true },
        fullNameHash: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const userDocumentSchema = new Schema<UserDocument>(
    {
        userIdentifier: { type: String, required: true },
        mobileUid: { type: String, index: true },
        documentType: { type: String, enum: Object.values(DocumentType), required: true },
        documentSubType: { type: String },
        documentIdentifier: { type: String, required: true, index: true },
        normalizedDocumentIdentifier: { type: String, index: true },
        ownerType: { type: String, enum: Object.values(OwnerType), required: true },
        docId: { type: String },
        docStatus: { type: Number },
        documentData: { type: Object },
        compoundDocument: { type: userCompoundDocumentSchema },
        registrationDate: { type: Date },
        issueDate: { type: Date },
        expirationDate: { type: Date, index: true },
        notifications: { type: notificationsSchema, default: {} },
        fullNameHash: { type: String },
        comparedTo: { type: comparedToSchema },
    },
    {
        timestamps: true,
    },
)

userDocumentSchema.index({ userIdentifier: 1, documentType: 1, documentIdentifier: 1 }, { unique: true })

export default <Model<UserDocument>>models.UserDocument || model('UserDocument', userDocumentSchema)
