import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DiiaOfficeStatus, ProfileFeature } from '@diia-inhouse/types'

import GetUserProfileFeaturesAction from '@actions/v1/userInfo/getUserProfileFeatures'

import UserProfileService from '@services/userProfile'

describe(`Action ${GetUserProfileFeaturesAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userProfileServiceMock = mockInstance(UserProfileService)

    const getUserProfileFeaturesAction = new GetUserProfileFeaturesAction(userProfileServiceMock)

    describe('method `handler`', () => {
        it('should return user profile features', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier', features: [ProfileFeature.office] },
                session: testKit.session.getUserSession(),
                headers,
            }

            const mockDiiaOfficeProfile = {
                profileId: 'profile123',
                organizationId: 'org123',
                unitId: 'unit123',
                scopes: ['scope1', 'scope2'],
                isOrganizationAdmin: true,
                status: DiiaOfficeStatus.ACTIVE,
            }

            const mockUserProfileFeatures = {
                [ProfileFeature.office]: mockDiiaOfficeProfile,
            }

            jest.spyOn(userProfileServiceMock, 'getUserProfileFeatures').mockResolvedValueOnce(mockUserProfileFeatures)

            expect(await getUserProfileFeaturesAction.handler(args)).toMatchObject(mockUserProfileFeatures)

            expect(userProfileServiceMock.getUserProfileFeatures).toHaveBeenCalledWith(args.params.userIdentifier, args.params.features)
        })
    })
})
