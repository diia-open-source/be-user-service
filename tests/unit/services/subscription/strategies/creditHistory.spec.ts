import { randomUUID } from 'node:crypto'

import DiiaLogger from '@diia-inhouse/diia-logger'
import { ServiceUnavailableError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import CreditHistoryStrategyService from '@services/subscription/strategies/creditHistory'

import CreditHistoryProvider from '@providers/creditHistory/ubch'

import subscriptionModel from '@models/subscription'

import { PublicServiceCode, SubscriptionSource, SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'
import { ProcessCode } from '@interfaces/services'
import { SubscriptionCode } from '@interfaces/services/subscription'

describe('CreditHistoryStrategyService', () => {
    const testKit = new TestKit()
    const creditHistoryProviderMock = mockInstance(CreditHistoryProvider)
    const loggerMock = mockInstance(DiiaLogger)
    const creditHistoryStrategyService = new CreditHistoryStrategyService(creditHistoryProviderMock, loggerMock)

    describe('method: `subscribe`', () => {
        const {
            user: { itn, identifier: userIdentifier },
        } = testKit.session.getUserSession()

        it('should successfully subscribe', async () => {
            const subId = randomUUID()
            const params = {
                code: SubscriptionCode.CreditHistory,
                itn,
                userIdentifier,
            }
            const subscription = new subscriptionModel({
                userIdentifier,
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: {
                            [userIdentifier]: false,
                        },
                    },
                },
            })

            jest.spyOn(creditHistoryProviderMock, 'subscribe').mockResolvedValueOnce(subId)

            expect(await creditHistoryStrategyService.subscribe(subscription, params)).toEqual({
                [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${SubscriptionCode.CreditHistory}.${userIdentifier}`]:
                    true,
                [`subscriptionIds.${SubscriptionSource.Ubch}`]: subId,
            })

            expect(creditHistoryProviderMock.subscribe).toHaveBeenCalledWith(itn)
        })

        it('should skip subscription in case subscription should not be done', async () => {
            const params = {
                code: SubscriptionCode.CreditHistory,
                itn,
                userIdentifier,
            }
            const subscription = new subscriptionModel({
                userIdentifier,
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: {
                            [userIdentifier]: true,
                        },
                    },
                },
            })

            expect(await creditHistoryStrategyService.subscribe(subscription, params)).toBeUndefined()
        })

        it('should failed with error in case provider subscription is failed', async () => {
            const providerError = new Error('Unable to subscribe')
            const params = {
                code: SubscriptionCode.CreditHistory,
                itn,
                userIdentifier,
            }
            const subscription = new subscriptionModel({
                userIdentifier,
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: {
                            [userIdentifier]: false,
                        },
                    },
                },
            })
            const expectedErrorMessage = `Failed to subscribe on ${SubscriptionCode.CreditHistory}`

            jest.spyOn(creditHistoryProviderMock, 'subscribe').mockRejectedValueOnce(providerError)

            await expect(async () => {
                await creditHistoryStrategyService.subscribe(subscription, params)
            }).rejects.toEqual(new ServiceUnavailableError(expectedErrorMessage, ProcessCode.FailedSubscribeCreditHistory))

            expect(creditHistoryProviderMock.subscribe).toHaveBeenCalledWith(itn)
            expect(loggerMock.error).toHaveBeenCalledWith(expectedErrorMessage, { err: providerError })
        })
    })

    describe('method: `getModifier`', () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()
        const subId = randomUUID()

        it.each([
            [
                {
                    [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${SubscriptionCode.CreditHistory}.${userIdentifier}`]:
                        true,
                    [`subscriptionIds.${SubscriptionSource.Ubch}`]: subId,
                },
                false,
            ],
            [
                {
                    [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${SubscriptionCode.CreditHistory}.${userIdentifier}`]:
                        true,
                    [`subscriptionIds.${SubscriptionSource.Ubch}`]: subId,
                    [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${SubscriptionCode.CreditHistory}.${userIdentifier}-auto`]:
                        true,
                },
                true,
            ],
        ])('should return modifier %s in case autoSubscribe %s', (expectedModifier, autoSubscribe) => {
            expect(creditHistoryStrategyService.getModifier(userIdentifier, subId, autoSubscribe)).toEqual(expectedModifier)
        })
    })

    describe('method: `publishSubscription`', () => {
        const {
            user: { itn, identifier: userIdentifier },
        } = testKit.session.getUserSession()

        it('should successfully publish subscription', async () => {
            const params = {
                code: SubscriptionCode.CreditHistory,
                itn,
                userIdentifier,
            }
            const subscription = new subscriptionModel({
                userIdentifier,
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: {
                            [userIdentifier]: false,
                        },
                    },
                },
            })

            jest.spyOn(creditHistoryProviderMock, 'publishSubscription').mockResolvedValueOnce()

            expect(await creditHistoryStrategyService.publishSubscription(subscription, params)).toBeUndefined()

            expect(creditHistoryProviderMock.publishSubscription).toHaveBeenCalledWith(itn)
        })

        it('should skip publish subscription in case subscription should not be done', async () => {
            const params = {
                code: SubscriptionCode.CreditHistory,
                itn,
                userIdentifier,
                autoSubscribe: true,
            }
            const subscription = new subscriptionModel({
                userIdentifier,
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: {
                            [userIdentifier]: false,
                            [`${userIdentifier}-auto`]: false,
                        },
                    },
                },
            })

            expect(await creditHistoryStrategyService.publishSubscription(subscription, params)).toBeUndefined()
        })
    })

    describe('method: `unsubscribe`', () => {
        const ubch = randomUUID()
        const {
            user: { itn, identifier: userIdentifier },
        } = testKit.session.getUserSession()
        const params = {
            code: SubscriptionCode.CreditHistory,
            itn,
            userIdentifier,
        }

        it('should successfully unsubscribe', async () => {
            const subscription = new subscriptionModel({
                userIdentifier,
                subscriptionIds: {
                    ubch,
                },
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: {
                            [userIdentifier]: true,
                        },
                    },
                },
            })

            jest.spyOn(creditHistoryProviderMock, 'unsubscribe').mockResolvedValueOnce()

            expect(await creditHistoryStrategyService.unsubscribe(subscription, params)).toEqual({
                $set: {
                    [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${PublicServiceCode.CreditHistory}.${userIdentifier}`]:
                        false,
                    [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${PublicServiceCode.CreditHistory}.${userIdentifier}-auto`]:
                        false,
                },
                $unset: {
                    [`subscriptionIds.${SubscriptionSource.Ubch}`]: 1,
                },
            })

            expect(creditHistoryProviderMock.unsubscribe).toHaveBeenCalledWith(itn, ubch)
        })

        it('should skip to unsubscribe in case there is no subscription for specific key', async () => {
            const subscription = new subscriptionModel({
                userIdentifier,
                subscriptionIds: {
                    ubch,
                },
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: {},
                    },
                },
            })

            expect(await creditHistoryStrategyService.unsubscribe(subscription, params)).toBeUndefined()
        })

        it('should skip to unsubscribe in case ubch subscription id not found', async () => {
            const subscription = new subscriptionModel({
                userIdentifier,
                subscriptionIds: {},
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: {
                            [userIdentifier]: true,
                        },
                    },
                },
            })

            expect(await creditHistoryStrategyService.unsubscribe(subscription, params)).toBeUndefined()
            expect(loggerMock.error).toHaveBeenCalledWith('Ubch subscription id not found')
        })

        it('should fail with error in case unsubscribe failed in provider', async () => {
            const subscription = new subscriptionModel({
                userIdentifier,
                subscriptionIds: {
                    ubch,
                },
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.CreditHistory]: {
                            [userIdentifier]: true,
                        },
                    },
                },
            })
            const providerError = new Error('Unable to unsubscribe')
            const errorMessage = `Failed to unsubscribe on ${PublicServiceCode.CreditHistory}`

            jest.spyOn(creditHistoryProviderMock, 'unsubscribe').mockRejectedValueOnce(providerError)

            await expect(async () => {
                await creditHistoryStrategyService.unsubscribe(subscription, params)
            }).rejects.toEqual(new ServiceUnavailableError(errorMessage, ProcessCode.FailedUnsubscribeCreditHistory))

            expect(creditHistoryProviderMock.unsubscribe).toHaveBeenCalledWith(itn, ubch)
            expect(loggerMock.error).toHaveBeenCalledWith(errorMessage, { err: providerError })
        })
    })
})
