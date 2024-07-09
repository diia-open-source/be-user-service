import { Model, Schema, model, models } from '@diia-inhouse/db'

import { DocumentFeaturePoints } from '@interfaces/models/documentFeaturePoints'

const documentFeaturePointsSchema = new Schema<DocumentFeaturePoints>(
    {
        userIdentifier: { type: String, required: true },
        documentType: { type: String, required: true },
        documentIdentifier: { type: String, required: true },
        requestId: { type: String, unique: true, required: true },
        points: { type: [Number] },
    },
    {
        timestamps: true,
    },
)

documentFeaturePointsSchema.index(
    {
        userIdentifier: 1,
        documentType: 1,
        documentIdentifier: 1,
    },
    {
        unique: true,
    },
)

export const skipSyncIndexes = true

export default <Model<DocumentFeaturePoints>>models.DocumentFeaturePoints || model('DocumentFeaturePoints', documentFeaturePointsSchema)
