import { Model, Schema, SchemaDefinition, model, models } from '@diia-inhouse/db'

import { DocumentTypeSetting, UserDocumentSettings, UserDocumentSettingsModel } from '@interfaces/models/userDocumentSettings'

const documentTypeSettingsSchema = new Schema<DocumentTypeSetting>(
    {
        documentTypeOrder: { type: Number, required: true },
        documentIdentifiers: { type: Object },
        hiddenDocuments: { type: [String] },
        hiddenDocumentType: { type: Boolean },
    },
    {
        _id: false,
    },
)

const userDocumentSettingsSchemaDefinition: SchemaDefinition<UserDocumentSettingsModel> = {
    type: Map,
    of: { type: [documentTypeSettingsSchema, { userIdentifier: { type: String, required: true } }] },
}

const userDocumentSettingsSchema = new Schema<UserDocumentSettings>(userDocumentSettingsSchemaDefinition, {
    timestamps: true,
    strict: false,
})

userDocumentSettingsSchema.index({ userIdentifier: 1 }, { unique: true })

export const skipSyncIndexes = true

export default <Model<UserDocumentSettings>>models.UserDocumentSettings || model('UserDocumentSettings', userDocumentSettingsSchema)
