import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/hashFilesToSign'
import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { SignAlgo } from '@interfaces/models/diiaId'

/**
 * Same as hashFilesToSign.v2, but without signing history.
 *
 * Use case: signing has multiple recipients, so signing history should be handled separately for each recipient.
 */
export default class HashFilesToSignAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'hashFilesToSign'

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
        options: {
            type: 'object',
            optional: true,
            props: {
                signType: { type: 'enum', values: Object.values(DiiaIdSignType).filter(Number.isInteger), optional: true },
                noSigningTime: { type: 'boolean', optional: true },
                noContentTimestamp: { type: 'boolean', optional: true },
            },
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { files, signAlgo, options },
            headers: { mobileUid },
            session: { user },
        } = args

        const hashedFiles = await this.diiaIdService.hashFilesToSign(user, mobileUid, files, signAlgo, options)

        return { hashedFiles }
    }
}
