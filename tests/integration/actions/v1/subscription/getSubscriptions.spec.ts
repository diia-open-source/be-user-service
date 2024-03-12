import { IdentifierService } from '@diia-inhouse/crypto'
import { GenericObject, UserSession } from '@diia-inhouse/types'

import GetSubscriptionsAction from '@actions/v1/subscription/getSubscriptions'

import SubscriptionService from '@services/subscription'

import subscriptionModel from '@models/subscription'

import SessionGenerator from '@tests/mocks/sessionGenerator'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/subscription/getSubscriptions'
import { PublicServiceCode, SubscriptionModel, SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'

describe(`Action ${GetSubscriptionsAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let identifier: IdentifierService
    let sessionGenerator: SessionGenerator
    let getSubscriptionsAction: GetSubscriptionsAction
    let subscriptionService: SubscriptionService
    let session: UserSession
    let storedSubscriptionData: GenericObject

    beforeAll(async () => {
        app = await getApp()

        identifier = app.container.resolve('identifier')!
        sessionGenerator = new SessionGenerator(identifier)
        getSubscriptionsAction = app.container.build(GetSubscriptionsAction)
        subscriptionService = app.container.build(SubscriptionService)
        session = sessionGenerator.getUserSession()

        const { user } = session
        const { itn, identifier: userIdentifier } = user

        storedSubscriptionData = {
            userIdentifier,
            subscriptionIds: {},
            [SubscriptionType.Push]: {
                [SubscriptionSubType.Documents]: {},
                [SubscriptionSubType.PublicServices]: {
                    [PublicServiceCode.Debts]: {
                        [identifier.createIdentifier(itn, { customSalt: subscriptionService.debtsSalt })]: true,
                    },
                    [PublicServiceCode.CreditHistory]: {
                        [userIdentifier]: false,
                    },
                },
            },
            [SubscriptionType.Segment]: {
                [SubscriptionSubType.PublicServices]: [],
            },
        }

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return subscriptions and store initial db record', async () => {
        const { user } = session
        const { identifier: userIdentifier } = user
        const headers = sessionGenerator.getHeaders()
        const { description }: ActionResult = await getSubscriptionsAction.handler({ session, headers })

        expect(description).toEqual(expect.any(String))
        // expect(subscriptions.length).toEqual(1);
        // const [subscription]: SubscriptionResponse[] = subscriptions;

        // expect(subscription).toEqual({
        //     name: expect.any(String),
        //     description: expect.any(String),
        //     code: PublicServiceCode.CreditHistory,
        //     status: SubscriptionStatus.InActive
        // });

        const storedSubscription = await subscriptionModel.findOneAndDelete({ userIdentifier }).lean()

        expect(storedSubscription).toMatchObject(storedSubscriptionData)
    })

    it('should not store new initial db record', async () => {
        const { user } = session
        const { identifier: userIdentifier } = user
        const headers = sessionGenerator.getHeaders()
        const { _id: id }: SubscriptionModel = await subscriptionModel.create(storedSubscriptionData)
        const { description }: ActionResult = await getSubscriptionsAction.handler({ session, headers })

        expect(description).toEqual(expect.any(String))
        // expect(subscriptions.length).toEqual(1);

        // const [subscription]: SubscriptionResponse[] = subscriptions;

        // expect(subscription).toEqual({
        //     name: expect.any(String),
        //     description: expect.any(String),
        //     code: PublicServiceCode.CreditHistory,
        //     status: SubscriptionStatus.InActive
        // });

        const storedSubscription = await subscriptionModel.findOneAndDelete({ userIdentifier }).lean()

        expect(storedSubscription).toMatchObject({
            ...storedSubscriptionData,
            _id: id,
        })
    })
})
