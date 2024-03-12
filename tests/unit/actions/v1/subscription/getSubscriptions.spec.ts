import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetSubscriptionsAction from '@actions/v1/subscription/getSubscriptions'

import SubscriptionService from '@services/subscription'

import { PublicServiceCode } from '@interfaces/models/subscription'
import { SubscriptionStatus } from '@interfaces/services/subscription'

describe(`Action ${GetSubscriptionsAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const subscriptionServiceMock = mockInstance(SubscriptionService)

    const getSubscriptionsAction = new GetSubscriptionsAction(subscriptionServiceMock)

    describe('method `handler`', () => {
        it('should return subscriptions', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers,
            }

            const subscriptionsResponse = {
                description: 'description',
                subscriptions: [
                    {
                        name: 'name',
                        description: 'description',
                        code: PublicServiceCode.CreditHistory,
                        status: SubscriptionStatus.Active,
                    },
                ],
            }

            jest.spyOn(subscriptionServiceMock, 'getSubscriptions').mockResolvedValueOnce(subscriptionsResponse)

            expect(await getSubscriptionsAction.handler(args)).toBe(subscriptionsResponse)

            expect(subscriptionServiceMock.getSubscriptions).toHaveBeenCalledWith(
                args.session.user.identifier,
                args.session.user.itn,
                args.headers,
            )
        })
    })
})
