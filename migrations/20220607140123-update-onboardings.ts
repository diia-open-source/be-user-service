import { Db } from 'mongodb'

import { SessionType } from '@diia-inhouse/types'

const onboardingCollectionName = 'onboardings'
const newFeaturesCollectionName = 'newfeatures'

export async function up(db: Db): Promise<void> {
    await Promise.all([
        db.collection(newFeaturesCollectionName).updateMany({}, { $set: { sessionType: SessionType.User } }),
        db.collection(onboardingCollectionName).updateMany({}, { $set: { sessionType: SessionType.User } }),
    ])
}
