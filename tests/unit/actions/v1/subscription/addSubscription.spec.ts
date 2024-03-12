import TestKit, { mockInstance } from '@diia-inhouse/test'

import AddSubscriptionAction from '@actions/v1/subscription/addSubscription'

import SubscriptionService from '@services/subscription'

import { SubscriptionCode } from '@interfaces/services/subscription'

describe(`Action ${AddSubscriptionAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const subscriptionServiceMock = mockInstance(SubscriptionService)

    const addSubscriptionAction = new AddSubscriptionAction(subscriptionServiceMock)

    const args = {
        params: {
            code: SubscriptionCode.CreditHistory,
            segmentId: 'segment123',
        },
        session: testKit.session.getUserSession(),
        headers,
    }

    describe('Method `handler`', () => {
        it('should return true when subscription is added', async () => {
            const expectedResult = {
                success: true,
            }

            jest.spyOn(subscriptionServiceMock, 'subscribe').mockResolvedValueOnce()

            expect(await addSubscriptionAction.handler(args)).toEqual(expectedResult)

            expect(subscriptionServiceMock.subscribe).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                itn: args.session.user.itn,
                code: args.params.code,
                segmentId: args.params.segmentId,
            })
        })
    })

    describe('Method `getLockResource`', () => {
        it('should return user identifier', () => {
            expect(addSubscriptionAction.getLockResource(args)).toEqual(args.session.user.identifier)
        })
    })
})
