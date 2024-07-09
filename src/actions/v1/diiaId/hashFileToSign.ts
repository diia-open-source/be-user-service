import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/hashFileToSign'
import { SignAlgo } from '@interfaces/models/diiaId'

/**
 * Extract hashes from file without init signing.
 *
 * Use case: extract hashes individually for each file for packages with large files
 */
export default class HashFileToSignAction implements GrpcAppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'hashFileToSign'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        processId: { type: 'string' },
        file: {
            type: 'object',
            props: {
                name: { type: 'string' },
                file: { type: 'string' },
                isRequireInternalSign: { type: 'boolean', optional: true },
            },
        },
        signAlgo: { type: 'string', enum: Object.values(SignAlgo) },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { processId, file, signAlgo },
        } = args

        const hashedFile = await this.diiaIdService.hashFileToSign(file!, signAlgo, processId)

        return { hashedFile }
    }
}
