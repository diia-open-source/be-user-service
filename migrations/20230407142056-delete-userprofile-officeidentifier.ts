import { Db } from 'mongodb'

export async function up(db: Db): Promise<void> {
    if ((await db.listCollections().toArray()).map((collection) => collection.name).includes('userprofiles')) {
        const userprofiles = db.collection('userprofiles')

        await userprofiles.updateMany(
            { 'features.office.officeIdentifier': { $ne: null } },
            { $unset: { 'features.office.officeIdentifier': 1 } },
        )
        await userprofiles.dropIndex('features.office.officeIdentifier_1')
    }
}
