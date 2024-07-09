import { randomUUID } from 'node:crypto'

import TestKit from '@diia-inhouse/test'

import PublicServiceStrategyService from '@services/subscription/strategies/publicService'

import subscriptionModel from '@models/subscription'

import { SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'
import { SubscriptionCode } from '@interfaces/services/subscription'

describe('PublicServiceStrategyService', () => {
    const testKit = new TestKit()
    const publicServiceStrategyService = new PublicServiceStrategyService()

    describe('method: `subscribe`', () => {
        const segmentId = randomUUID()
        const {
            user: { itn, identifier: userIdentifier },
        } = testKit.session.getUserSession()

        it('should successfully return modifier', async () => {
            const subscription = new subscriptionModel({
                userIdentifier,
                [SubscriptionType.Segment]: {
                    [SubscriptionSubType.PublicServices]: [],
                },
            })
            const params = {
                code: SubscriptionCode.PublicService,
                itn,
                userIdentifier,
                segmentId,
            }

            expect(await publicServiceStrategyService.subscribe(subscription, params)).toEqual({
                $addToSet: { [`${SubscriptionType.Segment}.${SubscriptionSubType.PublicServices}`]: segmentId },
            })
        })

        it('should skip to return modifier in case segmentId is present in subscribed segments', async () => {
            const subscription = new subscriptionModel({
                userIdentifier,
                [SubscriptionType.Segment]: {
                    [SubscriptionSubType.PublicServices]: [segmentId],
                },
            })
            const params = {
                code: SubscriptionCode.PublicService,
                itn,
                userIdentifier,
                segmentId,
            }

            expect(await publicServiceStrategyService.subscribe(subscription, params)).toBeUndefined()
        })

        it('should fail with error in case segmentId was not provided in params', async () => {
            const subscription = new subscriptionModel({
                userIdentifier,
                [SubscriptionType.Segment]: {
                    [SubscriptionSubType.PublicServices]: [segmentId],
                },
            })
            const params = {
                code: SubscriptionCode.PublicService,
                itn,
                userIdentifier,
            }

            await expect(async () => {
                await publicServiceStrategyService.subscribe(subscription, params)
            }).rejects.toEqual(new Error('segmentId is not provided'))
        })
    })
})
