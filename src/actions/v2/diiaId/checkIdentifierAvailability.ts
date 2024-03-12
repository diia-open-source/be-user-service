import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/diiaId/checkIdentifierAvailability'
import { DiiaIdIdentifier } from '@interfaces/services/diiaId'

export default class CheckDiiaIdIdentifierAvailabilityAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'checkDiiaIdIdentifierAvailability'

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid },
        } = args

        const identifiers: DiiaIdIdentifier[] = await this.diiaIdService.getIdentifierAvailability(userIdentifier, mobileUid)

        return { identifiers }
    }
}
