import { mongo } from '@diia-inhouse/db'
import { PlatformType } from '@diia-inhouse/types'

import distributionModel from '@models/distribution'

import { Distribution, DistributionModel } from '@interfaces/models/distribution'

export default class DistributionService {
    private readonly allPlatformTypes: PlatformType[] = Object.values(PlatformType)

    private readonly platformTypesSet: Set<PlatformType> = new Set(this.allPlatformTypes)

    async createOrUpdate(messageId: mongo.ObjectId, platformTypes?: PlatformType[]): Promise<[mongo.ObjectId, PlatformType[]]> {
        let distribution = await this.findByMessageId(messageId)
        let platformTypesToSend: PlatformType[] = []
        if (distribution) {
            if (platformTypes?.length) {
                for (const platformType of platformTypes) {
                    if (!distribution!.platformTypes.includes(platformType)) {
                        platformTypesToSend.push(platformType)
                    }
                }
            } else {
                for (const platformType of this.platformTypesSet) {
                    if (!distribution!.platformTypes.includes(platformType)) {
                        platformTypesToSend.push(platformType)
                    }
                }
            }

            if (platformTypesToSend.length > 0) {
                distribution.platformTypes = distribution.platformTypes.concat(platformTypesToSend)

                await distribution.save()
            }
        } else {
            platformTypesToSend = platformTypes?.length ? platformTypes : this.allPlatformTypes
            const newDistribution: Distribution = {
                messageId,
                platformTypes: platformTypesToSend,
            }

            distribution = await distributionModel.create(newDistribution)
        }

        return [distribution._id, platformTypesToSend]
    }

    private async findByMessageId(messageId: mongo.ObjectId): Promise<DistributionModel | null> {
        return await distributionModel.findOne({ messageId })
    }
}
