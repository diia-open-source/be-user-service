import TestKit, { mockInstance } from '@diia-inhouse/test'

import HasUserProfileAction from '@actions/v1/userInfo/hasUserProfile'

import UserProfileService from '@services/userProfile'

describe(`Action ${HasUserProfileAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userProfileServiceMock = mockInstance(UserProfileService)

    const hasUserProfileAction = new HasUserProfileAction(userProfileServiceMock)

    describe('method `handler`', () => {
        it('should return true if has user profile', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier' },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userProfileServiceMock, 'hasUserProfile').mockResolvedValueOnce(true)

            expect(await hasUserProfileAction.handler(args)).toBeTruthy()

            expect(userProfileServiceMock.hasUserProfile).toHaveBeenCalledWith(args.params.userIdentifier)
        })
    })
})
