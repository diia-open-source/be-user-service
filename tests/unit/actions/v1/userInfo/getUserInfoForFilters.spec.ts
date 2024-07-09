import TestKit, { mockInstance } from '@diia-inhouse/test'
import { Gender } from '@diia-inhouse/types'

import GetUserInfoForFiltersAction from '@actions/v1/userInfo/getUserInfoForFilters'

import UserProfileService from '@services/userProfile'

describe(`Action ${GetUserInfoForFiltersAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userProfileServiceMock = mockInstance(UserProfileService)

    const getUserInfoForFiltersAction = new GetUserInfoForFiltersAction(userProfileServiceMock)

    describe('method `handler`', () => {
        it('should return user info filters', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier' },
                session: testKit.session.getUserSession(),
                headers,
            }

            const userInfoFilters = {
                age: 30,
                gender: Gender.female,
                documents: { 'driver-license': 1 },
            }

            jest.spyOn(userProfileServiceMock, 'getUserFilterInfo').mockResolvedValueOnce(userInfoFilters)

            expect(await getUserInfoForFiltersAction.handler(args)).toMatchObject(userInfoFilters)

            expect(userProfileServiceMock.getUserFilterInfo).toHaveBeenCalledWith(args.params.userIdentifier)
        })
    })
})
