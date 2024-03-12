import 'module-alias/register'

import { Db } from 'mongodb'

import { UserActionAccessSetting } from '@interfaces/models/userActionAccessSetting'
import { ActionAccessType } from '@interfaces/services/userActionAccess'

const collectionName = 'useractionaccesssettings'

export async function up(db: Db): Promise<void> {
    const oneDayInSec: number = 24 * 60 * 60

    const setting: UserActionAccessSetting = {
        actionAccessType: ActionAccessType.AddBirthCertificate,
        maxValue: 10,
        expirationTime: oneDayInSec,
    }

    await db.collection(collectionName).insertOne(setting)
}

export async function down(db: Db): Promise<void> {
    await db.dropCollection(collectionName)
}
