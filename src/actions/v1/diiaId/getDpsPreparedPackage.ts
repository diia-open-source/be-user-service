import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/getDpsPreparedPackage'
import { SignAlgo } from '@interfaces/models/diiaId'

export default class GetDpsPreparedPackageAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getDpsPreparedPackage'

    readonly validationRules: ValidationSchema = {
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { signAlgo },
            headers: { mobileUid },
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        const taxPackage = await this.diiaIdService.getDpsPreparedPackage(userIdentifier, mobileUid, signAlgo)

        return { taxPackage }
    }
}
