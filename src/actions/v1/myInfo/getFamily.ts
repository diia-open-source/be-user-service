import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'

import MyInfoService from '@services/myInfo'

import { ActionResult } from '@interfaces/actions/v1/myInfo/getFamily'

export default class GetFamilyAction implements GrpcAppAction {
    constructor(private readonly myInfoService: MyInfoService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getFamily'

    async handler(): Promise<ActionResult> {
        return await this.myInfoService.getFamily()
    }
}
