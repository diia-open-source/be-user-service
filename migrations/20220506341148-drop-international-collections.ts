import 'module-alias/register'

import { Db } from 'mongodb'

export async function up(db: Db): Promise<void> {
    const toDrop = ['useritncounters', 'intitncounters', 'internationaluserprofiles', 'internationaluserdevices']

    const collections = (await db.listCollections().toArray()).map((collection: { name: string }) => collection.name)

    await Promise.all(toDrop.filter((collection) => collections.includes(collection)).map((collection) => db.dropCollection(collection)))
}
