import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/createDocumentFeaturePoints'

export default class CreateDocumentFeaturePoints implements AppAction {
    constructor(private readonly documentFeaturePointsService: DocumentFeaturePointsService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'createDocumentFeaturePoints'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        userIdentifier: { type: 'string', optional: true },
        documentType: { type: 'string', enum: Object.values(DocumentType) },
        documentIdentifier: { type: 'string' },
        photo: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { userIdentifier, documentType, documentIdentifier, photo } = args.params

        return {
            points: await this.documentFeaturePointsService.createDocumentFeaturePoints(
                userIdentifier,
                documentType,
                documentIdentifier,
                photo,
            ),
        }
    }
}
