import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import AuthService from '@services/auth'
import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/diiaId/createDiiaIdIdentifier'
import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'
import { AuthSchemaCode } from '@interfaces/services/auth'

export default class CreateDiiaIdIdentifierAction implements AppAction {
    constructor(
        private readonly authService: AuthService,
        private readonly diiaIdService: DiiaIdService,
    ) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'createDiiaIdIdentifier'

    readonly validationRules: ValidationSchema = {
        processId: { type: 'string' },
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { processId, signAlgo },
            headers: { mobileUid },
            session: { user },
        } = args

        const code: AuthSchemaCode =
            user.sessionType === SessionType.EResident ? AuthSchemaCode.EResidentDiiaIdCreation : AuthSchemaCode.DiiaIdCreation

        await this.authService.completeUserAuthSteps(user, code, processId)
        const identifier: string = await this.diiaIdService.createDiiaId(user, mobileUid, signAlgo)

        return { identifier, processCode: ProcessCode.DiiaIdCreated }
    }
}
