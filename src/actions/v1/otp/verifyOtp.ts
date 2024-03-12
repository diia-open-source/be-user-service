import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import OtpService from '@services/otp'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/otp/verifyOtp'

export default class VerifyOtpAction implements AppAction {
    constructor(private readonly otpService: OtpService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'verifyOtp'

    readonly validationRules: ValidationSchema = {
        otp: { type: 'number' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { otp },
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid },
        } = args

        const success: boolean = await this.otpService.verifyOtp(otp, userIdentifier, mobileUid)

        return { success }
    }
}
