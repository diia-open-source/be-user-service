import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userDocument/removeCovidCertificateFromStorage'
import { VaccinationCertificateType } from '@interfaces/services/userDocumentStorage'

export default class RemoveCovidCertificateFromStorageAction implements AppAction {
    constructor(private readonly userDocumentStorageService: UserDocumentStorageService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'removeCovidCertificateFromStorage'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
        mobileUid: { type: 'string' },
        documentType: {
            type: 'string',
            enum: ['local-vaccination-certificate', 'child-local-vaccination-certificate', 'international-vaccination-certificate'],
        },
        types: {
            type: 'array',
            items: { type: 'string', enum: Object.values(VaccinationCertificateType) },
        },
        birthCertificateId: { type: 'string', optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { userIdentifier, mobileUid, documentType, types, birthCertificateId } = args.params

        await this.userDocumentStorageService.removeCovidCertificateFromStorage(
            userIdentifier,
            documentType,
            mobileUid,
            types,
            birthCertificateId,
        )
    }
}
