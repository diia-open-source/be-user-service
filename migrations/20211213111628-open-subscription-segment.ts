/* eslint-disable max-len, no-console */
import 'module-alias/register'

import { Db, Document, Filter, FindCursor, ObjectId, UpdateResult, WithId } from 'mongodb'

import { Subscription } from '@interfaces/models/subscription'

const subscriptionsCollectionName = 'subscriptions'
const subscriptionsSegmentsMetaCollectionName = 'subscriptionssegmentsmeta'

interface SegmentMeta {
    segment: string
    prevLastId: ObjectId
    lastId: ObjectId
}

export async function up(db: Db): Promise<void> {
    const segment = '31101003'
    const segmentOpen = `${segment}-open`
    const limit: number = process.env.SUBSCRIPTION_SEGMENT_NOTIFICATION_LIMIT
        ? parseInt(process.env.SUBSCRIPTION_SEGMENT_NOTIFICATION_LIMIT, 10)
        : 1000
    const batchSize: number = process.env.SUBSCRIPTION_SEGMENT_NOTIFICATION_BATCH_SIZE
        ? parseInt(process.env.SUBSCRIPTION_SEGMENT_NOTIFICATION_BATCH_SIZE, 10)
        : 1000

    if (!limit) {
        console.log('Skip updating subscriptions')

        return
    }

    console.log(`Start updating ${limit} subscriptions with batch size of ${batchSize}`)

    const segmentMeta = await db.collection<SegmentMeta>(subscriptionsSegmentsMetaCollectionName).findOne({ segment: segmentOpen })

    const query: Filter<Subscription> = {
        'segment.publicServices': {
            $eq: segment,
            $ne: segmentOpen,
        },
    }
    if (segmentMeta) {
        query._id = { $gt: segmentMeta.lastId }
    }

    const subscriptionsCursor: FindCursor<WithId<Subscription>> = db
        .collection<Subscription>(subscriptionsCollectionName)
        .find(query, { projection: { _id: 1 } })
        .sort({ _id: 1 })
        .limit(limit)

    let idsToUpdate: ObjectId[] = []
    let lastUpdatedId: ObjectId | undefined
    let totallyUpdated = 0

    for await (const subscription of subscriptionsCursor) {
        idsToUpdate.push(subscription._id)
        lastUpdatedId = subscription._id

        if (idsToUpdate.length >= batchSize) {
            const { modifiedCount }: UpdateResult | Document = await db
                .collection<Subscription>(subscriptionsCollectionName)
                .updateMany({ _id: { $in: idsToUpdate } }, { $addToSet: { 'segment.publicServices': segmentOpen } })

            console.log(`Updated subscriptions: ${modifiedCount}`)

            idsToUpdate = []
            totallyUpdated += modifiedCount
        }
    }

    if (idsToUpdate.length) {
        const { modifiedCount }: UpdateResult | Document = await db
            .collection<Subscription>(subscriptionsCollectionName)
            .updateMany({ _id: { $in: idsToUpdate } }, { $addToSet: { 'segment.publicServices': segmentOpen } })

        console.log(`Updated subscriptions: ${modifiedCount}`)

        totallyUpdated += modifiedCount
    }

    console.log(`Totally updated: ${totallyUpdated}`)
    console.log(`Last updated: ${lastUpdatedId}`)

    await db.collection(subscriptionsSegmentsMetaCollectionName).updateOne(
        { segment: segmentOpen },
        {
            $set: {
                prevLastId: segmentMeta?.lastId,
                lastId: lastUpdatedId,
            },
        },
        { upsert: true },
    )
}
