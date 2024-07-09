import { mongo } from '@diia-inhouse/db'
import { ActHeaders, Logger } from '@diia-inhouse/types'

import userDeviceModel from '@models/userDevice'

export default class UserDeviceService {
    constructor(private readonly logger: Logger) {}

    async updateDevice(userIdentifier: string, headers: ActHeaders): Promise<void> {
        const { mobileUid, platformVersion, platformType } = headers

        await userDeviceModel.updateOne(
            { mobileUid },
            {
                $set: { platformVersion, userIdentifier },
                $setOnInsert: { mobileUid, platformType },
            },
            { upsert: true },
        )
    }

    async unassignDevice(mobileUid: string, userIdentifier: string): Promise<void> {
        const { modifiedCount }: mongo.UpdateResult = await userDeviceModel.updateOne(
            { mobileUid, userIdentifier },
            { $unset: { userIdentifier: 1 } },
        )
        if (modifiedCount === 1) {
            this.logger.info('Successfully unassign device from user', { mobileUid, userIdentifier })

            this.logger.info('Analytics', {
                analytics: {
                    date: new Date().toISOString(),
                    category: 'users',
                    action: {
                        type: 'removeDevice',
                        result: 'success',
                    },
                    identifier: userIdentifier,
                    device: {
                        identifier: mobileUid,
                    },
                },
            })
        } else {
            this.logger.error('Failed to unassign device from user', { mobileUid, userIdentifier })
        }
    }
}
