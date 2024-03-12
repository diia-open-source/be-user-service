import { compare as compareVersions } from 'compare-versions'

import { PlatformType, UserActionHeaders } from '@diia-inhouse/types'

import {
    PublicServiceCode,
    PublicServicesSubs,
    PushSubscriptionBySubType,
    Subscription,
    SubscriptionModel,
    SubscriptionSubType,
    SubscriptionType,
} from '@interfaces/models/subscription'
import { SubscriptionResponse, SubscriptionStatus, SubscriptionsResponse } from '@interfaces/services/subscription'

export default class SubscriptionDataMapper {
    private readonly subNameByServiceCode: Record<PublicServiceCode, string> = {
        [PublicServiceCode.Debts]: '',
        [PublicServiceCode.CreditHistory]: 'Кредитна історія',
    }

    private readonly subDescriptionByServiceCode: Record<PublicServiceCode, string> = {
        [PublicServiceCode.Debts]: '',
        [PublicServiceCode.CreditHistory]: 'Отримання сповіщень щодо змін в кредитній історії',
    }

    private readonly activeServiceCodes: PublicServiceCode[] = [PublicServiceCode.CreditHistory]

    private readonly minAvailableAppVersion: Record<PlatformType, string> = {
        [PlatformType.Android]: '3.0.22',
        [PlatformType.Huawei]: '3.0.22',
        [PlatformType.iOS]: '3.0.26',
        [PlatformType.Browser]: '3.0.26',
    }

    toSubscriptionsResponse(userSubscription: SubscriptionModel, headers: UserActionHeaders): SubscriptionsResponse {
        if (!this.areSubscriptionsAvailable(headers)) {
            return {
                description: 'Працюємо над оновленням. Незабаром можна буде налаштувати сповіщення в Дії.',
                subscriptions: [],
            }
        }

        const type: SubscriptionType = SubscriptionType.Push
        const subType: SubscriptionSubType = SubscriptionSubType.PublicServices

        const userSubscriptionObject: Subscription = <Subscription>userSubscription.toObject()
        const subscriptionsByType: PushSubscriptionBySubType = userSubscriptionObject[type]
        const subscriptionsBySubType: PublicServicesSubs = subscriptionsByType[subType]

        const subscriptions: SubscriptionResponse[] = Object.entries(subscriptionsBySubType)
            .filter(([serviceCode]) => this.activeServiceCodes.includes(<PublicServiceCode>serviceCode))
            .map(([serviceCode, items]) => {
                const code = <PublicServiceCode>serviceCode
                const isSomeItemSubscribed: boolean = Object.values(items).some((isSubscribed: boolean) => isSubscribed)
                const status: SubscriptionStatus = isSomeItemSubscribed ? SubscriptionStatus.Active : SubscriptionStatus.InActive

                return {
                    name: this.subNameByServiceCode[code],
                    description: this.subDescriptionByServiceCode[code],
                    code,
                    status,
                }
            })

        return {
            description: 'Тут ви можете налаштувати, які саме сповіщення будуть надходити вам у Дію',
            subscriptions,
        }
    }

    private areSubscriptionsAvailable(headers: UserActionHeaders): boolean {
        const { platformType, appVersion } = headers

        const minVersion = this.minAvailableAppVersion[platformType]

        return compareVersions(appVersion, minVersion, '>=')
    }
}
