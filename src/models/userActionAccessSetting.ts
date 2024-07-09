import { Model, Schema, model, models } from '@diia-inhouse/db'

import { UserActionAccessSetting } from '@interfaces/models/userActionAccessSetting'
import { ActionAccessType } from '@interfaces/services/userActionAccess'

const userActionAccessSettingSchema = new Schema<UserActionAccessSetting>(
    {
        actionAccessType: { type: String, enum: Object.values(ActionAccessType), unique: true, required: true },
        maxValue: { type: Number, required: true },
        expirationTime: { type: Number, required: true },
    },
    {
        timestamps: true,
    },
)

export const skipSyncIndexes = true

export default <Model<UserActionAccessSetting>>models.UserActionAccessSetting ||
    model('UserActionAccessSetting', userActionAccessSettingSchema)
