import TestKit, { mockInstance } from '@diia-inhouse/test'

import IsSubscribedAction from '@actions/v1/subscription/isSubscribed'

import SubscriptionService from '@services/subscription'

import { PublicServiceCode } from '@interfaces/models/subscription'

describe(`Action ${IsSubscribedAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const subscriptionServiceMock = mockInstance(SubscriptionService)

    const isSubscribedAction = new IsSubscribedAction(subscriptionServiceMock)

    describe('method `handler`', () => {
        it('should return true if user has subscription', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    publicService: PublicServiceCode.CreditHistory,
                    subscriptionKey: 'subscriptionKey',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(subscriptionServiceMock, 'isSubscribed').mockResolvedValueOnce(true)

            expect(await isSubscribedAction.handler(args)).toBeTruthy()

            expect(subscriptionServiceMock.isSubscribed).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.publicService,
                args.params.subscriptionKey,
            )
        })
    })
})
