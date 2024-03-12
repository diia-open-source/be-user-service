import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/checkIdentifierAvailability'
import { SignAlgo } from '@interfaces/models/diiaId'
import { DiiaIdIdentifier } from '@interfaces/services/diiaId'

export default class CheckDiiaIdIdentifierAvailabilityAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'checkDiiaIdIdentifierAvailability'

    readonly validationRules: ValidationSchema = {
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { signAlgo },
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid },
        } = args

        const identifiers: DiiaIdIdentifier[] = await this.diiaIdService.getIdentifierAvailability(userIdentifier, mobileUid)

        return { identifier: identifiers.find((identifier) => identifier.signAlgo === signAlgo)?.identifier }
    }
}
