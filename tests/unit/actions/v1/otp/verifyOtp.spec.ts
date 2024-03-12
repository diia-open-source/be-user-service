import TestKit, { mockInstance } from '@diia-inhouse/test'

import VerifyOtpAction from '@actions/v1/otp/verifyOtp'

import OtpService from '@services/otp'

describe(`Action ${VerifyOtpAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const integrityCheckServiceMock = mockInstance(OtpService)

    const verifyOtpAction = new VerifyOtpAction(integrityCheckServiceMock)

    describe('method `handler`', () => {
        it('should return true if successfully verified otp', async () => {
            const args = {
                params: {
                    otp: 1,
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(integrityCheckServiceMock, 'verifyOtp').mockResolvedValueOnce(true)

            expect(await verifyOtpAction.handler(args)).toMatchObject({ success: true })

            expect(integrityCheckServiceMock.verifyOtp).toHaveBeenCalledWith(
                args.params.otp,
                args.session.user.identifier,
                args.headers.mobileUid,
            )
        })
    })
})
