import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'

import OtpService from '@services/otp'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/otp/isOtpWasUsed'

export default class IsOtpWasUsedAction implements AppAction {
    constructor(private readonly otpService: OtpService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'isOtpWasUsed'

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid },
        } = args

        return await this.otpService.isOtpWasUsed(userIdentifier, mobileUid)
    }
}
