import { Model, Schema, model, models } from '@diia-inhouse/db'

import { diiaOfficeProfileSchema } from '@models/userProfile'

import { UnregisteredOfficeProfile } from '@interfaces/models/unregisteredOfficeProfile'

const unregisteredOfficeProfile = new Schema<UnregisteredOfficeProfile>({
    identifier: { type: String, unique: true, required: true },
    profile: { type: diiaOfficeProfileSchema },
})

export default <Model<UnregisteredOfficeProfile>>models.UnregisteredOfficeProfile ||
    model('UnregisteredOfficeProfile', unregisteredOfficeProfile)
