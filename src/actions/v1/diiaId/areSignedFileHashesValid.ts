import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/areSignedFileHashesValid'
import { SignAlgo } from '@interfaces/models/diiaId'

export default class AreSignedFileHashesValidAction implements AppAction {
    constructor(private readonly diiaIdService: DiiaIdService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

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
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { files, signAlgo },
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid },
        } = args

        const { areValid } = await this.diiaIdService.areSignedFileHashesValid({
            userIdentifier,
            mobileUid,
            files,
            signAlgo,
        })

        return areValid
    }
}
