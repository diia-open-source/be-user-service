import { Model, Schema, model, models } from '@diia-inhouse/db'

import { UserNewFeatures } from '@interfaces/models/userNewFeatures'

const userFeaturesSchema = new Schema<UserNewFeatures>(
    {
        mobileUid: { type: String, required: true, unique: true },
        featuresAppVersion: { type: String, required: true },
        viewsCounter: { type: Number, required: true },
    },
    {
        timestamps: true,
    },
)

export default <Model<UserNewFeatures>>models.UserFeatures || model('UserFeatures', userFeaturesSchema)
