import { randomUUID as uuid } from 'node:crypto'

import { ApiError } from '@diia-inhouse/errors'
import TestKit from '@diia-inhouse/test'
import { UserSession } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import AddSubscriptionAction from '@actions/v1/subscription/addSubscription'
import GetSubscriptionsAction from '@actions/v1/subscription/getSubscriptions'

import subscriptionModel from '@models/subscription'

import SubscribeNock from '@mocks/providers/creditHistory/ubch'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/subscription/addSubscription'
import { PublicServiceCode, SubscriptionSource, SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'
import { ProcessCode } from '@interfaces/services'
import { SubscriptionCode } from '@interfaces/services/subscription'

describe(`Action ${AddSubscriptionAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let testKit: TestKit
    let addSubscriptionAction: AddSubscriptionAction
    let getSubscriptionsAction: GetSubscriptionsAction
    let subscribeNock: SubscribeNock

    beforeAll(async () => {
        app = await getApp()

        testKit = app.container.resolve('testKit')
        addSubscriptionAction = app.container.build(AddSubscriptionAction)
        getSubscriptionsAction = app.container.build(GetSubscriptionsAction)
        subscribeNock = app.container.build(SubscribeNock)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it(`should subscribe on ${SubscriptionCode.CreditHistory}`, async () => {
        const session: UserSession = testKit.session.getUserSession()
        const headers = testKit.session.getHeaders()
        const {
            user: { identifier: userIdentifier },
        } = session

        await getSubscriptionsAction.handler({ session, headers })

        const subId: string = uuid()

        await subscribeNock.subscribe(subId)

        const { success }: ActionResult = await addSubscriptionAction.handler({
            params: { code: SubscriptionCode.CreditHistory },
            session,
            headers,
        })

        expect(success).toBe(true)
        const subscription = await subscriptionModel.findOneAndDelete({ userIdentifier }).lean()

        expect(subscription).toMatchObject({
            subscriptionIds: {
                [SubscriptionSource.Ubch]: subId,
            },
            [SubscriptionType.Push]: {
                [SubscriptionSubType.PublicServices]: {
                    [PublicServiceCode.CreditHistory]: {
                        [userIdentifier]: true,
                    },
                },
            },
        })
    })

    it(`should not subscribe on ${SubscriptionCode.CreditHistory} if failed to receive sub id`, async () => {
        const session: UserSession = testKit.session.getUserSession()
        const headers = testKit.session.getHeaders()
        const {
            user: { identifier: userIdentifier },
        } = session
        const subId: string = uuid()

        await subscribeNock.subscribe(subId, true)

        await getSubscriptionsAction.handler({ session, headers })

        const getError = async (): Promise<ApiError> => {
            try {
                await addSubscriptionAction.handler({
                    params: { code: SubscriptionCode.CreditHistory },
                    session,
                    headers,
                })

                throw new Error('Not thrown')
            } catch (err) {
                return utils.handleError(err, (e) => e)
            }
        }

        const error = await getError()

        expect(error.getData().processCode).toEqual(ProcessCode.FailedSubscribeCreditHistory)
        const subscription = await subscriptionModel.findOneAndDelete({ userIdentifier }).lean()

        expect(subscription).toMatchObject({
            // subscriptionIds: {},
            [SubscriptionType.Push]: {
                [SubscriptionSubType.PublicServices]: {
                    [PublicServiceCode.CreditHistory]: {
                        [userIdentifier]: false,
                    },
                },
            },
        })
    })

    it(`should subscribe on ${SubscriptionCode.PublicService}`, async () => {
        const segmentId = '31101003'
        const session: UserSession = testKit.session.getUserSession()
        const headers = testKit.session.getHeaders()
        const {
            user: { identifier: userIdentifier },
        } = session

        await getSubscriptionsAction.handler({ session, headers })

        const { success }: ActionResult = await addSubscriptionAction.handler({
            params: { code: SubscriptionCode.PublicService, segmentId },
            headers,
            session,
        })

        expect(success).toBe(true)
        const subscription = await subscriptionModel.findOneAndDelete({ userIdentifier }).lean()

        expect(subscription).toMatchObject({
            subscriptionIds: {},
            [SubscriptionType.Segment]: {
                [SubscriptionSubType.PublicServices]: [segmentId],
            },
        })
    })
})
