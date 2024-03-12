import { UpdateResult } from 'mongodb'

import { ActHeaders, Logger } from '@diia-inhouse/types'

import eResidentDeviceModel from '@models/eResidentDevice'

export default class EResidentDeviceService {
    constructor(private readonly logger: Logger) {}

    async updateDevice(userIdentifier: string, headers: ActHeaders): Promise<void> {
        const { mobileUid, platformVersion, platformType } = headers

        await eResidentDeviceModel.updateOne(
            { mobileUid },
            {
                $set: { platformVersion, userIdentifier },
                $setOnInsert: { mobileUid, platformType },
            },
            { upsert: true },
        )
    }

    async unassignDevice(mobileUid: string, userIdentifier: string): Promise<void> {
        const { modifiedCount }: UpdateResult = await eResidentDeviceModel.updateOne(
            { mobileUid, userIdentifier },
            { $unset: { userIdentifier: 1 } },
        )
        if (modifiedCount === 1) {
            this.logger.info('Successfully unassign device from user', { mobileUid, userIdentifier })

            this.logger.info('Analytics', {
                analytics: {
                    date: new Date().toISOString(),
                    category: 'eresidents',
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
