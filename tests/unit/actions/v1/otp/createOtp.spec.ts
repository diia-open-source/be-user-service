import TestKit, { mockInstance } from '@diia-inhouse/test'

import CreateOtpAction from '@actions/v1/otp/createOtp'

import OtpService from '@services/otp'

import { OtpModel } from '@interfaces/models/otp'

describe(`Action ${CreateOtpAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const otpServiceMock = mockInstance(OtpService)

    const createOtpAction = new CreateOtpAction(otpServiceMock)

    describe('method `handler`', () => {
        it('should return true if created otp', async () => {
            const args = {
                params: { phoneNumber: 'phoneNumber' },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(otpServiceMock, 'createOtp').mockResolvedValueOnce(<OtpModel>{})

            expect(await createOtpAction.handler(args)).toMatchObject({ success: true })

            expect(otpServiceMock.createOtp).toHaveBeenCalledWith(args.params.phoneNumber, args.session.user, args.headers)
        })
    })
})
