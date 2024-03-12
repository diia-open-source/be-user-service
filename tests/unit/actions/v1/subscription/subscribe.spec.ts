import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import SubscribeAction from '@actions/v1/subscription/subscribe'

import SubscriptionService from '@services/subscription'

import { SubscriptionType } from '@interfaces/models/subscription'

describe(`Action ${SubscribeAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const subscriptionServiceMock = mockInstance(SubscriptionService)

    const subscribeAction = new SubscribeAction(subscriptionServiceMock)

    describe('method `handler`', () => {
        it('should return true if successfully set subscription', async () => {
            const args = {
                params: {
                    subscriptionType: SubscriptionType.Push,
                    documentType: DocumentType.EResidentPassport,
                    documentSubscriptionId: 'documentSubscriptionId',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(subscriptionServiceMock, 'setDocumentsSubscription').mockResolvedValueOnce()

            expect(await subscribeAction.handler(args)).toMatchObject({ success: true })

            expect(subscriptionServiceMock.setDocumentsSubscription).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                subscriptionType: args.params.subscriptionType,
                documentType: args.params.documentType,
                documentSubscriptionId: args.params.documentSubscriptionId,
                isSubscribed: true,
                headers: args.headers,
            })
        })
    })
})
