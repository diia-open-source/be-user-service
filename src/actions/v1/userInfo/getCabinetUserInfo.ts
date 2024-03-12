import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'

import UserProfileService from '@services/userProfile'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userInfo/getCabinetUserInfo'

export default class GetCabinetUserInfoAction implements AppAction {
    constructor(private readonly userProfileService: UserProfileService) {}

    readonly sessionType: SessionType = SessionType.CabinetUser

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getCabinetUserInfo'

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { user } = args.session

        return this.userProfileService.getCabinetUserInfo(user)
    }
}
