import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/initHashesSigning'
import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { SignAlgo } from '@interfaces/models/diiaId'

export default class InitHashesSigningAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'initDiiaIdHashesSigning'

    readonly validationRules: ValidationSchema = {
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
        signType: { type: 'enum', values: Object.values(DiiaIdSignType).filter(Number.isInteger), optional: true },
        noSigningTime: { type: 'boolean', optional: true },
        noContentTimestamp: { type: 'boolean', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { signAlgo, signType, noSigningTime, noContentTimestamp },
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid },
        } = args

        return {
            success: await this.diiaIdService.initHashesSigning(
                userIdentifier,
                mobileUid,
                signAlgo,
                signType,
                noSigningTime,
                noContentTimestamp,
            ),
        }
    }
}
