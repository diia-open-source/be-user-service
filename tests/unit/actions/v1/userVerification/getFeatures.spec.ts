import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetFeaturesAction from '@actions/v1/userVerification/getFeatures'

import OnboardingService from '@services/onboarding'

describe(`Action ${GetFeaturesAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const onboardingServiceMock = mockInstance(OnboardingService)

    const getFeaturesAction = new GetFeaturesAction(onboardingServiceMock)

    describe('method `handler`', () => {
        it('should return features', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers,
            }

            const features = {
                header: {
                    logo: 'logo',
                    title: 'title',
                    subTitle: 'subTitle',
                },
                boards: [],
            }

            jest.spyOn(onboardingServiceMock, 'getFeatures').mockResolvedValueOnce({ features })

            expect(await getFeaturesAction.handler(args)).toMatchObject({ features })

            expect(onboardingServiceMock.getFeatures).toHaveBeenCalledWith(
                args.headers.mobileUid,
                args.headers.appVersion,
                args.headers.platformType,
            )
        })
    })
})
