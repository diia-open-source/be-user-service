import { Model, Schema, SchemaDefinition, model, models } from '@diia-inhouse/db'

import {
    DocumentsSubs,
    PublicServiceCode,
    PublicServicesSubs,
    PushSubscriptionBySubType,
    SegmentSubscriptionBySubType,
    Subscription,
    SubscriptionIds,
    SubscriptionSource,
    SubscriptionSubType,
    SubscriptionType,
} from '@interfaces/models/subscription'

const documentsSubscriptionSchemaDefinition: SchemaDefinition<DocumentsSubs> = {
    type: Map,
    of: { type: Object },
}

const publicServiceSubscriptionSchemaDefinition: SchemaDefinition<PublicServicesSubs> = ((): SchemaDefinition<PublicServicesSubs> => {
    const acc: SchemaDefinition<PublicServicesSubs> = {}

    for (const type of Object.values(PublicServiceCode)) {
        acc[type] = { type: Object }
    }

    return acc
})()

const documentsSubscriptionSchema = new Schema<DocumentsSubs>(documentsSubscriptionSchemaDefinition, { _id: false, strict: false })
const publicServiceSubscriptionSchema = new Schema<PublicServicesSubs>(publicServiceSubscriptionSchemaDefinition, { _id: false })

const pushSubscriptionByTypeSchema = new Schema<PushSubscriptionBySubType>(
    {
        [SubscriptionSubType.Documents]: { type: documentsSubscriptionSchema, required: true },
        [SubscriptionSubType.PublicServices]: { type: publicServiceSubscriptionSchema, required: true },
    },
    {
        _id: false,
        minimize: false,
    },
)

const segmentSubscriptionByTypeSchema = new Schema<SegmentSubscriptionBySubType>(
    {
        [SubscriptionSubType.PublicServices]: { type: [String], required: true },
    },
    {
        _id: false,
        minimize: false,
    },
)

const subscriptionIdsSchema = new Schema<SubscriptionIds>(
    {
        [SubscriptionSource.Ubch]: { type: String },
    },
    {
        _id: false,
        minimize: false,
    },
)

const subscriptionSchema = new Schema<Subscription>(
    {
        userIdentifier: { type: String, unique: true, required: true },
        subscriptionIds: { type: subscriptionIdsSchema, required: true },
        [SubscriptionType.Push]: { type: pushSubscriptionByTypeSchema, required: true },
        [SubscriptionType.Segment]: { type: segmentSubscriptionByTypeSchema },
    },
    { timestamps: true, minimize: false },
)

subscriptionSchema.index({ [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${PublicServiceCode.Debts}.$**`]: 1 })
subscriptionSchema.index({ [`${SubscriptionType.Segment}.${SubscriptionSubType.PublicServices}`]: 1 })

export default <Model<Subscription>>models.Subscription || model('Subscription', subscriptionSchema)
