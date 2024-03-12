require('dotenv-flow').config({ silent: true })

import { MongoHelper } from '@diia-inhouse/db'

module.exports = {
    ...MongoHelper.migrateMongoConfig,
}
