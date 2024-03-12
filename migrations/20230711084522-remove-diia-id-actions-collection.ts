import 'module-alias/register'
import { config } from 'dotenv-flow'
import { Db } from 'mongodb'

config({ silent: true })

export async function dropCollectionIfExists(db: Db, collectionName: string): Promise<void> {
    const collectionExists = await db.listCollections({ name: collectionName }).hasNext()
    if (collectionExists) {
        await db.collection(collectionName).drop()
    }
}

export async function up(db: Db): Promise<void> {
    await dropCollectionIfExists(db, 'diiaidactions')
}
