import { Model, Schema, SchemaDefinition, model, models } from 'mongoose'

import { DocumentType } from '@diia-inhouse/types'

import { DocumentTypeSetting, UserDocumentSettings, UserDocumentSettingsModel } from '@interfaces/models/userDocumentSettings'

const documentTypeSettingsSchema = new Schema<DocumentTypeSetting>(
    {
        documentTypeOrder: { type: Number, required: true },
        documentIdentifiers: { type: Object },
        hiddenDocuments: { type: [String] },
    },
    {
        _id: false,
    },
)

const userDocumentSettingsSchemaDefinition: SchemaDefinition<UserDocumentSettings> = Object.values(DocumentType).reduce(
    (acc: SchemaDefinition<UserDocumentSettingsModel>, type: DocumentType) => {
        acc[type] = { type: documentTypeSettingsSchema }

        return acc
    },
    { userIdentifier: { type: String, required: true } },
)

const userDocumentSettingsSchema = new Schema<UserDocumentSettings>(userDocumentSettingsSchemaDefinition, { timestamps: true })

userDocumentSettingsSchema.index({ userIdentifier: 1 }, { unique: true })

export const skipSyncIndexes = true

export default <Model<UserDocumentSettings>>models.UserDocumentSettings || model('UserDocumentSettings', userDocumentSettingsSchema)
