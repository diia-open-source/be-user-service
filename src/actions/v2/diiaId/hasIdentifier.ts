import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { BadRequestError } from '@diia-inhouse/errors'
import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/diiaId/hasIdentifier'

export default class HasDiiaIdIdentifierAction implements GrpcAppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'hasDiiaIdIdentifierV2'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        userIdentifier: { type: 'string' },
        mobileUidToExclude: { type: 'string', optional: true },
        mobileUid: { type: 'string', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, mobileUidToExclude, mobileUid },
        } = args

        if (mobileUidToExclude && mobileUid) {
            throw new BadRequestError('Only one of mobileUidToExclude and mobileUid can be provided')
        }

        const hasDiiaIdIdentifierResult = await this.diiaIdService.hasIdentifier(userIdentifier, mobileUidToExclude, mobileUid)

        return { hasDiiaIdIdentifierResult }
    }
}
