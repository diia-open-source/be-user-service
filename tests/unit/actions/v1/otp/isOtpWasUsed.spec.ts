import TestKit, { mockInstance } from '@diia-inhouse/test'

import IsOtpWasUsedAction from '@actions/v1/otp/isOtpWasUsed'

import OtpService from '@services/otp'

describe(`Action ${IsOtpWasUsedAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const otpServiceMock = mockInstance(OtpService)

    const isOtpWasUsedAction = new IsOtpWasUsedAction(otpServiceMock)

    describe('method `handler`', () => {
        it('should return false if otp was not used', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(otpServiceMock, 'isOtpWasUsed').mockResolvedValueOnce(false)

            expect(await isOtpWasUsedAction.handler(args)).toBeFalsy()

            expect(otpServiceMock.isOtpWasUsed).toHaveBeenCalledWith(args.session.user.identifier, args.headers.mobileUid)
        })
    })
})
