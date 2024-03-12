import { v4 as uuid } from 'uuid'

import { IdentifierService } from '@diia-inhouse/crypto'
import { ApiError } from '@diia-inhouse/errors'
import { UserSession } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import AddSubscriptionAction from '@actions/v1/subscription/addSubscription'
import GetSubscriptionsAction from '@actions/v1/subscription/getSubscriptions'
import RemoveSubscriptionAction from '@actions/v1/subscription/removeSubscription'

import subscriptionModel from '@models/subscription'

import SubscribeNock from '@mocks/providers/creditHistory/ubch'

import SessionGenerator from '@tests/mocks/sessionGenerator'
import { getApp } from '@tests/utils/getApp'

import { PublicServiceCode, SubscriptionSource, SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'
import { ProcessCode } from '@interfaces/services'
import { SubscriptionCode } from '@interfaces/services/subscription'

describe(`Action ${RemoveSubscriptionAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let identifier: IdentifierService
    let sessionGenerator: SessionGenerator
    let addSubscriptionAction: AddSubscriptionAction
    let getSubscriptionsAction: GetSubscriptionsAction
    let removeSubscriptionAction: RemoveSubscriptionAction
    let subscribeNock: SubscribeNock

    beforeAll(async () => {
        app = await getApp()

        identifier = app.container.resolve('identifier')!
        sessionGenerator = new SessionGenerator(identifier)
        addSubscriptionAction = app.container.build(AddSubscriptionAction)
        getSubscriptionsAction = app.container.build(GetSubscriptionsAction)
        removeSubscriptionAction = app.container.build(RemoveSubscriptionAction)
        subscribeNock = app.container.build(SubscribeNock)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it(`should unsubscribe from ${SubscriptionCode.CreditHistory}`, async () => {
        const session: UserSession = sessionGenerator.getUserSession()
        const headers = sessionGenerator.getHeaders()
        const {
            user: { identifier: userIdentifier, itn },
        } = session

        await getSubscriptionsAction.handler({ session, headers })

        const subId: string = uuid()

        await subscribeNock.subscribe(subId)

        const code: SubscriptionCode = SubscriptionCode.CreditHistory

        await addSubscriptionAction.handler({ params: { code }, session, headers })

        await subscribeNock.unsubscribe(itn, subId)
        const { success } = await removeSubscriptionAction.handler({ params: { code }, session, headers })

        expect(success).toBe(true)
        const subscription = await subscriptionModel.findOneAndDelete({ userIdentifier }).lean()

        expect(subscription).toMatchObject({
            subscriptionIds: {},
            [SubscriptionType.Push]: {
                [SubscriptionSubType.PublicServices]: {
                    [PublicServiceCode.CreditHistory]: {
                        [userIdentifier]: false,
                    },
                },
            },
        })
    })

    it(`should not unsubscribe from ${SubscriptionCode.CreditHistory} if provider request failed`, async () => {
        const session: UserSession = sessionGenerator.getUserSession()
        const headers = sessionGenerator.getHeaders()
        const {
            user: { identifier: userIdentifier, itn },
        } = session

        await getSubscriptionsAction.handler({ session, headers })

        const subId: string = uuid()

        await subscribeNock.subscribe(subId)

        const code: SubscriptionCode = SubscriptionCode.CreditHistory

        await addSubscriptionAction.handler({ params: { code }, session, headers })

        await subscribeNock.unsubscribe(itn, subId, true)

        // expect.assertions(2)

        const getError = async (): Promise<ApiError> => {
            try {
                await removeSubscriptionAction.handler({ params: { code }, session, headers })

                throw new Error('Not thrown')
            } catch (err) {
                return utils.handleError(err, (e) => e)
            }
        }

        const error = await getError()

        expect(error.getData().processCode).toEqual(ProcessCode.FailedUnsubscribeCreditHistory)

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
})
