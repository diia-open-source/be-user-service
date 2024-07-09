import { Model, Schema, model, models } from '@diia-inhouse/db'

import { ServiceUser } from '@interfaces/models/serviceUser'

const ServiceUserSchema = new Schema<ServiceUser>(
    {
        login: { type: String, required: true, unique: true },
        hashedPassword: { type: String },
        twoFactorSecret: { type: String, unique: true, sparse: true },
    },
    {
        timestamps: true,
    },
)

export default <Model<ServiceUser>>models.ServiceUser || model('ServiceUser', ServiceUserSchema)
