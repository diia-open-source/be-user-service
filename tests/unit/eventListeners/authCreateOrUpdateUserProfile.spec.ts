const momentStub = jest.fn()

jest.mock('moment', () => momentStub)

import { IdentifierService } from '@diia-inhouse/crypto'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import AuthCreateOrUpdateUserProfileEventListener from '@src/eventListeners/authCreateOrUpdateUserProfile'

import SubscriptionService from '@services/subscription'
import UserProfileService from '@services/userProfile'

describe('AuthCreateOrUpdateUserProfileEventListener', () => {
    const testKit = new TestKit()
    const subscriptionServiceMock = mockInstance(SubscriptionService)
    const userProfileServiceMock = mockInstance(UserProfileService)
    const identifierServiceMock = mockInstance(IdentifierService)
    const authCreateOrUpdateUserProfileEventListener = new AuthCreateOrUpdateUserProfileEventListener(
        subscriptionServiceMock,
        userProfileServiceMock,
        identifierServiceMock,
    )

    beforeAll(() => {
        jest.useFakeTimers()
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const {
                user: { itn, gender, birthDay, identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const message = {
                itn,
                gender,
                birthDay,
                headers,
            }
            const dateOfBirth = new Date()

            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(userIdentifier)
            momentStub.mockReturnValueOnce({ valueOf: () => dateOfBirth.getTime() })
            jest.spyOn(subscriptionServiceMock, 'setPublicServiceSubscriptions').mockResolvedValueOnce()
            jest.spyOn(userProfileServiceMock, 'createOrUpdateProfile').mockResolvedValueOnce()

            expect(await authCreateOrUpdateUserProfileEventListener.handler(message)).toBeUndefined()

            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(itn)
            expect(momentStub).toHaveBeenCalledWith(birthDay, 'DD.MM.YYYY')
            expect(subscriptionServiceMock.setPublicServiceSubscriptions).toHaveBeenCalledWith(userIdentifier, itn)
            expect(userProfileServiceMock.createOrUpdateProfile).toHaveBeenCalledWith(
                { identifier: userIdentifier, gender, birthDay: dateOfBirth },
                headers,
                itn,
            )
        })
    })
})
