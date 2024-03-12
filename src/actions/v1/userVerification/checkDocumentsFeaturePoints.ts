import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userVerification/checkDocumentsFeaturePoints'

export default class CheckDocumentsFeaturePointsAction implements AppAction {
    constructor(private readonly documentFeaturePointsService: DocumentFeaturePointsService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'checkDocumentsFeaturePoints'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { userIdentifier } = args.params

        return {
            documents: await this.documentFeaturePointsService.checkDocumentsFeaturePoints(userIdentifier),
        }
    }
}
