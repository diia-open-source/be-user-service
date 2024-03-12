import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v3/diiaId/areSignedFileHashesValid'
import { SignAlgo } from '@interfaces/models/diiaId'

export default class AreSignedFileHashesValidAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V3

    readonly name: string = 'areSignedFileHashesValid'

    readonly validationRules: ValidationSchema = {
        files: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    name: { type: 'string' },
                    hash: { type: 'string' },
                    signature: { type: 'string' },
                },
            },
        },
        returnOriginals: { type: 'boolean', optional: true },
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { files, returnOriginals, signAlgo },
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid },
        } = args

        return await this.diiaIdService.areSignedFileHashesValid({ userIdentifier, mobileUid, files, returnOriginals, signAlgo })
    }
}
