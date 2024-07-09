import 'module-alias/register'

import { mongo } from '@diia-inhouse/db'

import { UserActionAccessSetting } from '@interfaces/models/userActionAccessSetting'
import { ActionAccessType } from '@interfaces/services/userActionAccess'

const collectionName = 'useractionaccesssettings'

export async function up(db: mongo.Db): Promise<void> {
    const oneDayInSec: number = 24 * 60 * 60

    const setting: UserActionAccessSetting = {
        actionAccessType: ActionAccessType.AddBirthCertificate,
        maxValue: 10,
        expirationTime: oneDayInSec,
    }

    await db.collection(collectionName).insertOne(setting)
}

export async function down(db: mongo.Db): Promise<void> {
    await db.dropCollection(collectionName)
}
