import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import AuthService from '@services/auth'
import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/createIdentifiers'
import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'
import { AuthSchemaCode } from '@interfaces/services/auth'

export default class CreateDiiaIdIdentifiersAction implements AppAction {
    constructor(
        private readonly authService: AuthService,
        private readonly diiaIdService: DiiaIdService,
    ) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'createDiiaIdIdentifiers'

    readonly validationRules: ValidationSchema = {
        processId: { type: 'string' },
        signAlgo: {
            type: 'array',
            items: {
                type: 'string',
                enum: Object.values(SignAlgo),
            },
        },
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
        const identifiers = await this.diiaIdService.createDiiaIds(user, mobileUid, signAlgo)

        return { identifiers, processCode: ProcessCode.DiiaIdCreated }
    }
}
