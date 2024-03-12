import { randomUUID } from 'crypto'

import TestKit from '@diia-inhouse/test'
import { PlatformType } from '@diia-inhouse/types'

import subscriptionModel from '@models/subscription'

import SubscriptionDataMapper from '@dataMappers/subscriptionDataMapper'

import { PublicServiceCode, SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'
import { SubscriptionStatus } from '@interfaces/services/subscription'

describe(`Data Mapper ${SubscriptionDataMapper.name}`, () => {
    const testKit = new TestKit()
    const dataMapper = new SubscriptionDataMapper()

    describe(`method ${dataMapper.toSubscriptionsResponse.name}`, () => {
        it.each([
            [SubscriptionStatus.Active, { a: true, b: false }],
            [SubscriptionStatus.InActive, { a: false, b: false }],
        ])('should return subscriptions response with %s status if subscriptions are available by headers', (status, subscriptionItems) => {
            const headers = testKit.session.getHeaders()
            const model = new subscriptionModel({
                userIdentifier: randomUUID(),
                subscriptionIds: {},
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.Documents]: {},
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: subscriptionItems,
                        [PublicServiceCode.Debts]: {},
                    },
                },
            })

            const result = dataMapper.toSubscriptionsResponse(model, headers)

            expect(result).toEqual({
                description: 'Тут ви можете налаштувати, які саме сповіщення будуть надходити вам у Дію',
                subscriptions: [
                    {
                        name: 'Кредитна історія',
                        description: 'Отримання сповіщень щодо змін в кредитній історії',
                        code: PublicServiceCode.CreditHistory,
                        status,
                    },
                ],
            })
        })

        it('should return empty subscriptions if feature is not available by headers', () => {
            const headers = testKit.session.getHeaders({
                platformType: PlatformType.Android,
                appVersion: '3.0.20',
            })
            const model = new subscriptionModel({
                userIdentifier: randomUUID(),
                subscriptionIds: {},
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.Documents]: {},
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: { a: true, b: false },
                        [PublicServiceCode.Debts]: {},
                    },
                },
            })

            const result = dataMapper.toSubscriptionsResponse(model, headers)

            expect(result).toEqual({
                description: 'Працюємо над оновленням. Незабаром можна буде налаштувати сповіщення в Дії.',
                subscriptions: [],
            })
        })
    })
})
