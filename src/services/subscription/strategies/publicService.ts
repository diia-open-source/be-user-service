import { UpdateQuery } from 'mongoose'

import { SubscriptionModel, SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'
import { SubscriptionCode, SubscriptionParams, SubscriptionStrategy } from '@interfaces/services/subscription'

export default class PublicServiceStrategyService implements SubscriptionStrategy {
    readonly subscriptionCode: SubscriptionCode = SubscriptionCode.PublicService

    async subscribe(subscription: SubscriptionModel, params: SubscriptionParams): Promise<void | UpdateQuery<SubscriptionModel>> {
        const { segmentId } = params
        if (!segmentId) {
            throw new Error('segmentId is not provided')
        }

        const subscribedSegments = subscription[SubscriptionType.Segment]?.[SubscriptionSubType.PublicServices]
        if (subscribedSegments?.includes(segmentId)) {
            return
        }

        const modifier: UpdateQuery<SubscriptionModel> = {
            $addToSet: { [`${SubscriptionType.Segment}.${SubscriptionSubType.PublicServices}`]: segmentId },
        }

        return modifier
    }
}
