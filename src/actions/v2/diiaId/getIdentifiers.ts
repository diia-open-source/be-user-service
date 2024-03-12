import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType, UserActionArguments } from '@diia-inhouse/types'

import DiiaIdService from '@services/diiaId'

import { ActionResult } from '@interfaces/actions/v2/diiaId/getIdentifiers'

export default class GetDiiaIdIdentifiersAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'getDiiaIdIdentifiers'

    async handler(args: UserActionArguments): Promise<ActionResult> {
        const {
            session: { user },
            headers,
        } = args

        return await this.diiaIdService.getIdentifiers(user, headers)
    }
}
