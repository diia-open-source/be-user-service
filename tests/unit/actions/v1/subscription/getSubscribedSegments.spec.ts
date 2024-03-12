import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetSubscribedSegmentsAction from '@actions/v1/subscription/getSubscribedSegments'

import SubscriptionService from '@services/subscription'

describe(`Action ${GetSubscribedSegmentsAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const subscriptionServiceMock = mockInstance(SubscriptionService)

    const getSubscribedSegmentsAction = new GetSubscribedSegmentsAction(subscriptionServiceMock)

    describe('method `handler`', () => {
        it('should return subscribed segments', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const subscribedSegments = ['segment1', 'segment2']

            jest.spyOn(subscriptionServiceMock, 'getSubscribedSegments').mockResolvedValueOnce(subscribedSegments)

            expect(await getSubscribedSegmentsAction.handler(args)).toMatchObject(subscribedSegments)

            expect(subscriptionServiceMock.getSubscribedSegments).toHaveBeenCalledWith(args.params.userIdentifier)
        })
    })
})
