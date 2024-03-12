import TestKit, { mockInstance } from '@diia-inhouse/test'
import { SessionType } from '@diia-inhouse/types'

import GetEResidentFeaturesAction from '@actions/v1/userVerification/getEResidentFeatures'

import OnboardingService from '@services/onboarding'

describe(`Action ${GetEResidentFeaturesAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const onboardingServiceMock = mockInstance(OnboardingService)

    const getEResidentFeaturesAction = new GetEResidentFeaturesAction(onboardingServiceMock)

    describe('method `handler`', () => {
        it('should return onboarding info', async () => {
            const args = {
                session: testKit.session.getEResidentSession(),
                headers,
            }

            const onboardingInfo = {
                features: {
                    header: {
                        logo: 'logo',
                    },
                    boards: [],
                },
            }

            jest.spyOn(onboardingServiceMock, 'getFeatures').mockResolvedValueOnce(onboardingInfo)

            expect(await getEResidentFeaturesAction.handler(args)).toMatchObject(onboardingInfo)

            expect(onboardingServiceMock.getFeatures).toHaveBeenCalledWith(
                args.headers.mobileUid,
                args.headers.appVersion,
                args.headers.platformType,
                SessionType.EResident,
            )
        })
    })
})
