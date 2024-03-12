import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/getDpsHashFilesToSign'
import { SignAlgo } from '@interfaces/models/diiaId'

export default class GetDpsHashFilesToSignAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getDpsHashFilesToSign'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        files: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    name: { type: 'string' },
                    file: { type: 'string' },
                    isRequireInternalSign: { type: 'boolean', optional: true },
                },
            },
        },
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { files, signAlgo },
            headers: { mobileUid },
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        const hashedFiles = await this.diiaIdService.getDpsHashFilesToSign(userIdentifier, mobileUid, files, signAlgo)

        return { hashedFiles }
    }
}
