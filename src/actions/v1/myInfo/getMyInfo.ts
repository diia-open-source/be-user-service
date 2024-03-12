import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'

import MyInfoService from '@services/myInfo'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/myInfo/getMyInfo'

export default class GetMyInfoAction implements GrpcAppAction {
    constructor(private readonly myInfoService: MyInfoService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getMyInfo'

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            session: { user },
        } = args

        return await this.myInfoService.getMyInfo(user)
    }
}
