import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/diiaId/getIdentifier'
import { SignAlgo } from '@interfaces/models/diiaId'

export default class GetDiiaIdIdentifierAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'getDiiaIdIdentifier'

    readonly validationRules: ValidationSchema = {
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { signAlgo },
            session: { user },
            headers,
        } = args

        return await this.diiaIdService.getIdentifierV2(user, headers, signAlgo)
    }
}
