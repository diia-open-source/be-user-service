import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/deleteIdentifier'
import { ProcessCode } from '@interfaces/services'

export default class DeleteDiiaIdIdentifierAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'deleteDiiaIdIdentifier'

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid },
        } = args

        const success: boolean = await this.diiaIdService.softDeleteIdentifiers(userIdentifier, { mobileUid })
        const processCode: ProcessCode = success ? ProcessCode.DiiaIdSuccessfullyDeleted : ProcessCode.DiiaIdNotFound

        return {
            success: true,
            processCode,
        }
    }
}
