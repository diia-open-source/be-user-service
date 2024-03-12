import TestKit, { mockInstance } from '@diia-inhouse/test'

import RemoveSubscriptionAction from '@actions/v1/subscription/removeSubscription'

import SubscriptionService from '@services/subscription'

import { PublicServiceCode } from '@interfaces/models/subscription'
import { SubscriptionCode } from '@interfaces/services/subscription'

describe(`Action ${RemoveSubscriptionAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const subscriptionServiceMock = mockInstance(SubscriptionService)

    const removeSubscriptionAction = new RemoveSubscriptionAction(subscriptionServiceMock)

    const args = {
        params: {
            userIdentifier: 'userIdentifier',
            code: SubscriptionCode.CreditHistory,
            publicService: PublicServiceCode.CreditHistory,
        },
        session: testKit.session.getUserSession(),
        headers,
    }

    describe('method `handler`', () => {
        it('should return true if successfully unsubscribed', async () => {
            jest.spyOn(subscriptionServiceMock, 'unsubscribe').mockResolvedValueOnce()

            expect(await removeSubscriptionAction.handler(args)).toMatchObject({ success: true })

            expect(subscriptionServiceMock.unsubscribe).toHaveBeenCalledWith({
                itn: args.session.user.itn,
                userIdentifier: args.session.user.identifier,
                code: args.params.code,
            })
        })
    })

    describe('Method `getLockResource`', () => {
        it('should return user identifier', () => {
            expect(removeSubscriptionAction.getLockResource(args)).toEqual(args.session.user.identifier)
        })
    })
})
