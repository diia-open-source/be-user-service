import TestKit, { mockInstance } from '@diia-inhouse/test'

import UnsubscribeAction from '@actions/v1/subscription/unsubscribe'

import SubscriptionService from '@services/subscription'

import { SubscriptionType } from '@interfaces/models/subscription'

describe(`Action ${UnsubscribeAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const subscriptionServiceMock = mockInstance(SubscriptionService)

    const unsubscribeAction = new UnsubscribeAction(subscriptionServiceMock, [])

    describe('method `handler`', () => {
        it('should return true if successfully unsubscribed', async () => {
            const args = {
                params: {
                    subscriptionType: SubscriptionType.Push,
                    documentType: 'e-resident-passport',
                    documentSubscriptionId: 'documentSubscriptionId',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(subscriptionServiceMock, 'setDocumentsSubscription').mockResolvedValueOnce()

            expect(await unsubscribeAction.handler(args)).toMatchObject({ success: true })

            expect(subscriptionServiceMock.setDocumentsSubscription).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                subscriptionType: args.params.subscriptionType,
                documentType: args.params.documentType,
                documentSubscriptionId: args.params.documentSubscriptionId,
                isSubscribed: false,
                headers: args.headers,
            })
        })
    })
})
