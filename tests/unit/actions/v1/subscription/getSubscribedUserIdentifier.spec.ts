import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetSubscribedUserIdentifierAction from '@actions/v1/subscription/getSubscribedUserIdentifier'

import SubscriptionService from '@services/subscription'

import { PublicServiceCode, SubscriptionType } from '@interfaces/models/subscription'

describe(`Action ${GetSubscribedUserIdentifierAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const subscriptionServiceMock = mockInstance(SubscriptionService)

    const getSubscribedUserIdentifierAction = new GetSubscribedUserIdentifierAction(subscriptionServiceMock)

    describe('method `handler`', () => {
        it('should return subscribed user identifier', async () => {
            const args = {
                params: {
                    subscriptionType: SubscriptionType.Segment,
                    publicServiceCode: PublicServiceCode.CreditHistory,
                    subscribedIdentifier: 'subscribedIdentifier',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const subscribedUserIdentifier = 'subscribedUserIdentifier'

            jest.spyOn(subscriptionServiceMock, 'getSubscribedUserIdentifier').mockResolvedValueOnce(subscribedUserIdentifier)

            expect(await getSubscribedUserIdentifierAction.handler(args)).toBe(subscribedUserIdentifier)

            expect(subscriptionServiceMock.getSubscribedUserIdentifier).toHaveBeenCalledWith(
                args.params.subscriptionType,
                args.params.publicServiceCode,
                args.params.subscribedIdentifier,
            )
        })
    })
})
