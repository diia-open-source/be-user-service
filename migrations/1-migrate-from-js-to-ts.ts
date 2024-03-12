import 'module-alias/register'
import { config as migrationConfig } from 'migrate-mongo'
import { Db } from 'mongodb'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv-flow').config({ silent: true })

export async function up(db: Db): Promise<void> {
    const { changelogCollectionName } = await migrationConfig.read()

    const collectionName = changelogCollectionName
    const collections = await db.listCollections().toArray()

    const migrationsExists = collections.find(({ name }) => name === collectionName)
    if (!migrationsExists) {
        // eslint-disable-next-line no-console
        console.log(`Collection ${collectionName} does not exist. Skipping js files conversion.`)

        return
    }

    const { matchedCount } = await db.collection(collectionName).updateMany({ fileName: /.js$/ }, [
        {
            $set: {
                fileName: {
                    $replaceOne: { input: '$fileName', find: '.js', replacement: '.ts' },
                },
            },
        },
    ])

    if (matchedCount) {
        throw Error(`Past migrations history changed - updated filenames in ${matchedCount} files. Please run migrations again`)
    }
}
