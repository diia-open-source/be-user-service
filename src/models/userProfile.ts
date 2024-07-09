import { Model, Schema, model, models } from '@diia-inhouse/db'
import { DiiaOfficeStatus, Gender, ProfileFeature } from '@diia-inhouse/types'

import {
    CitizenshipSource,
    DiiaOfficeProfile,
    UserProfile,
    UserProfileCitizenship,
    UserProfileFeatures,
} from '@interfaces/models/userProfile'

const citizenshipSchema = new Schema<UserProfileCitizenship>(
    {
        country: { type: String, required: true },
        date: { type: Date, required: true },
        sourceId: { type: String },
    },
    { _id: false },
)

const citizenshipBySourceSchema = new Schema<Record<CitizenshipSource, UserProfileCitizenship>>(
    {
        [CitizenshipSource.BankAccount]: { type: citizenshipSchema },
    },
    { _id: false },
)

export const diiaOfficeProfileSchema = new Schema<DiiaOfficeProfile>(
    {
        profileId: { type: String, required: true, unique: true, sparse: true },
        unitId: { type: String, required: true },
        scopes: { type: [String], required: true, default: [] },
        organizationId: { type: String, required: true },
        tokenError: { type: String },
        tokenFailedAt: { type: Date },
        isOrganizationAdmin: { type: Boolean, required: true },
        googleWorkspace: { type: String },
        status: { type: String, enum: Object.values(DiiaOfficeStatus), required: true, default: DiiaOfficeStatus.ACTIVE },
    },
    { _id: false },
)

const featuresSchema = new Schema<UserProfileFeatures>(
    {
        [ProfileFeature.office]: { type: diiaOfficeProfileSchema },
    },
    { _id: false },
)

const userProfileSchema = new Schema<UserProfile>(
    {
        identifier: { type: String, unique: true, required: true },
        gender: { type: String, enum: Object.values(Gender), required: true },
        birthDay: { type: Date, required: true },
        citizenship: { type: citizenshipBySourceSchema },
        communityCode: { type: String },
        features: { type: featuresSchema },
    },
    { timestamps: true },
)

userProfileSchema.index({ gender: 1, birthDay: 1 })
userProfileSchema.index({ birthDay: 1, gender: 1 })
userProfileSchema.index({ 'features.office.organizationId': 1 }, { sparse: true })

export default <Model<UserProfile>>models.UserProfile || model('UserProfile', userProfileSchema)
