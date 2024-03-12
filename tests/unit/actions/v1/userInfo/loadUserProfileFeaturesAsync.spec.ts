import TestKit, { mockInstance } from '@diia-inhouse/test'

import LoadUserProfilesFeaturesAsyncAction from '@actions/v1/userInfo/loadUserProfileFeaturesAsync'

import UserProfileService from '@services/userProfile'

describe(`Action ${LoadUserProfilesFeaturesAsyncAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userProfileServiceMock = mockInstance(UserProfileService)

    const loadUserProfilesFeaturesAsyncAction = new LoadUserProfilesFeaturesAsyncAction(userProfileServiceMock)

    describe('method `handler`', () => {
        it('should successfully load user profile features', async () => {
            const args = {
                params: { itn: testKit.session.generateItn(testKit.session.getBirthDate(), testKit.session.getGender(), false) },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userProfileServiceMock, 'checkForUserProfileFeatures').mockResolvedValueOnce()

            await loadUserProfilesFeaturesAsyncAction.handler(args)

            expect(userProfileServiceMock.checkForUserProfileFeatures).toHaveBeenCalledWith(args.params.itn)
        })
    })
})
