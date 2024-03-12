import { IdentifierService } from '@diia-inhouse/crypto'
import { GenericObject, UserSession } from '@diia-inhouse/types'

import GetSubscribedUserIdentifierAction from '@actions/v1/subscription/getSubscribedUserIdentifier'
import GetSubscriptionsAction from '@actions/v1/subscription/getSubscriptions'

import SubscriptionService from '@services/subscription'

import subscriptionModel from '@models/subscription'

import SessionGenerator from '@tests/mocks/sessionGenerator'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/subscription/getSubscribedUserIdentifier'
import { PublicServiceCode, SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'

describe(`Action ${GetSubscribedUserIdentifierAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let identifierService: IdentifierService
    let sessionGenerator: SessionGenerator
    let getSubscribedUserIdentifierAction: GetSubscribedUserIdentifierAction
    let getSubscriptionsAction: GetSubscriptionsAction
    let subscriptionService: SubscriptionService
    let session: UserSession
    let subscribedIdentifier: string
    let storedSubscriptionData: GenericObject

    beforeAll(async () => {
        app = await getApp()

        identifierService = app.container.resolve<IdentifierService>('identifier')!
        sessionGenerator = new SessionGenerator(identifierService)
        getSubscribedUserIdentifierAction = app.container.build(GetSubscribedUserIdentifierAction)
        getSubscriptionsAction = app.container.build(GetSubscriptionsAction)
        subscriptionService = app.container.build(SubscriptionService)
        subscriptionService = app.container.build(SubscriptionService)

        session = sessionGenerator.getUserSession()
        const { user } = session
        const { itn, identifier: userIdentifier } = user

        subscribedIdentifier = identifierService.createIdentifier(itn, { customSalt: subscriptionService.debtsSalt })

        storedSubscriptionData = {
            userIdentifier,
            subscriptionIds: {},
            [SubscriptionType.Push]: {
                [SubscriptionSubType.Documents]: {},
                [SubscriptionSubType.PublicServices]: {
                    [PublicServiceCode.Debts]: {
                        [subscribedIdentifier]: true,
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

    it('should return identifier of subscribed user', async () => {
        const { user } = session
        const { identifier: userIdentifier } = user
        const headers = sessionGenerator.getHeaders()

        await getSubscriptionsAction.handler({ session, headers })

        const identifier: ActionResult = await getSubscribedUserIdentifierAction.handler({
            headers,
            params: {
                subscriptionType: SubscriptionType.Push,
                publicServiceCode: PublicServiceCode.Debts,
                subscribedIdentifier,
            },
        })

        expect(identifier).toEqual(userIdentifier)

        const storedSubscription = await subscriptionModel.findOneAndDelete({ userIdentifier }).lean()

        expect(storedSubscription).toMatchObject(storedSubscriptionData)
    })

    it('should return undefined if no subscribed user found', async () => {
        const { user } = session
        const { identifier: userIdentifier } = user
        const headers = sessionGenerator.getHeaders()

        await getSubscriptionsAction.handler({ session, headers })

        const unknownSubscribedIdentifier = 'unkownDebtIdentifier'
        const identifier: ActionResult = await getSubscribedUserIdentifierAction.handler({
            params: {
                subscriptionType: SubscriptionType.Push,
                publicServiceCode: PublicServiceCode.Debts,
                subscribedIdentifier: unknownSubscribedIdentifier,
            },
            headers,
        })

        expect(identifier).toBeUndefined()

        const storedSubscription = await subscriptionModel.findOneAndDelete({ userIdentifier }).lean()

        expect(storedSubscription).toMatchObject(storedSubscriptionData)
    })
})
