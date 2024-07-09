import { UpdateQuery } from '@diia-inhouse/db'
import { ServiceUnavailableError } from '@diia-inhouse/errors'
import { Logger } from '@diia-inhouse/types'

import {
    PublicServiceCode,
    SubscriptionItems,
    SubscriptionModel,
    SubscriptionSource,
    SubscriptionSubType,
    SubscriptionType,
} from '@interfaces/models/subscription'
import { CreditHistoryProvider } from '@interfaces/providers/creditHistory'
import { ProcessCode } from '@interfaces/services'
import { SubscriptionCode, SubscriptionParams, SubscriptionStrategy } from '@interfaces/services/subscription'

export default class CreditHistoryStrategyService implements SubscriptionStrategy {
    readonly subscriptionCode: SubscriptionCode = SubscriptionCode.CreditHistory

    private readonly publicServiceCode = PublicServiceCode.CreditHistory

    constructor(
        private readonly creditHistoryProvider: CreditHistoryProvider,
        private readonly logger: Logger,
    ) {}

    async subscribe(subscription: SubscriptionModel, params: SubscriptionParams): Promise<UpdateQuery<SubscriptionModel> | void | never> {
        const { userIdentifier, itn, autoSubscribe } = params
        if (!this.isSubscriptionShouldBeDone(subscription, userIdentifier, autoSubscribe)) {
            return
        }

        let subId: string
        try {
            subId = await this.creditHistoryProvider.subscribe(itn)
        } catch (err) {
            const msg = `Failed to subscribe on ${this.subscriptionCode}`

            this.logger.error(msg, { err })

            throw new ServiceUnavailableError(msg, ProcessCode.FailedSubscribeCreditHistory)
        }

        return this.getModifier(userIdentifier, subId)
    }

    getModifier(userIdentifier: string, subId: string, autoSubscribe?: boolean): UpdateQuery<SubscriptionModel> {
        const subscriptionKey: string = this.prepareSubscriptionKey(userIdentifier)
        const modifier: UpdateQuery<SubscriptionModel> = {
            [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${this.publicServiceCode}.${subscriptionKey}`]: true,
            [`subscriptionIds.${SubscriptionSource.Ubch}`]: subId,
        }
        const autoSubscriptionKey: string = this.prepareAutoSubscribtionKey(subscriptionKey)
        const autoSubscribeModifier: UpdateQuery<SubscriptionModel> = autoSubscribe
            ? { [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${this.publicServiceCode}.${autoSubscriptionKey}`]: true }
            : {}

        return { ...modifier, ...autoSubscribeModifier }
    }

    async publishSubscription(subscription: SubscriptionModel, params: SubscriptionParams): Promise<void> {
        const { userIdentifier, itn, autoSubscribe } = params
        if (!this.isSubscriptionShouldBeDone(subscription, userIdentifier, autoSubscribe)) {
            return
        }

        await this.creditHistoryProvider.publishSubscription(itn)
    }

    private isSubscriptionShouldBeDone(
        subscription: SubscriptionModel,
        userIdentifier: string,
        autoSubscribe: boolean | undefined,
    ): boolean {
        const type = SubscriptionType.Push
        const items: SubscriptionItems = subscription[type][SubscriptionSubType.PublicServices][this.publicServiceCode]
        const subscriptionKey = this.prepareSubscriptionKey(userIdentifier)
        if (items[subscriptionKey]) {
            return false
        }

        const autoSubscriptionKey = this.prepareAutoSubscribtionKey(subscriptionKey)
        if (autoSubscribe && items[autoSubscriptionKey] !== undefined) {
            return false
        }

        return true
    }

    async unsubscribe(subscription: SubscriptionModel, params: SubscriptionParams): Promise<void | UpdateQuery<SubscriptionModel>> {
        const { userIdentifier, itn } = params
        const type = SubscriptionType.Push
        const items: SubscriptionItems = subscription[type][SubscriptionSubType.PublicServices][this.publicServiceCode]
        const subscriptionKey = this.prepareSubscriptionKey(userIdentifier)
        const autoSubscribtionKey = this.prepareAutoSubscribtionKey(subscriptionKey)
        if (!items[subscriptionKey]) {
            return
        }

        const { ubch: subId } = subscription.subscriptionIds
        if (!subId) {
            this.logger.error('Ubch subscription id not found')

            return
        }

        try {
            await this.creditHistoryProvider.unsubscribe(itn, subId)
        } catch (err) {
            const msg = `Failed to unsubscribe on ${this.subscriptionCode}`

            this.logger.error(msg, { err })

            throw new ServiceUnavailableError(msg, ProcessCode.FailedUnsubscribeCreditHistory)
        }

        const modifier: UpdateQuery<SubscriptionModel> = {
            $set: {
                [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${this.publicServiceCode}.${subscriptionKey}`]: false,
                [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${this.publicServiceCode}.${autoSubscribtionKey}`]: false,
            },
            $unset: {
                [`subscriptionIds.${SubscriptionSource.Ubch}`]: 1,
            },
        }

        return modifier
    }

    private prepareSubscriptionKey(userIdentifier: string): string {
        return userIdentifier
    }

    private prepareAutoSubscribtionKey(key: string): string {
        return `${key}-auto`
    }
}
