import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserDocumentService from '@services/userDocument'
import UserProfileService from '@services/userProfile'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/isUkrainianCitizen'
import { CitizenshipSource } from '@interfaces/models/userProfile'

export default class IsUkrainianCitizenAction implements AppAction {
    constructor(
        private readonly userDocumentService: UserDocumentService,
        private readonly userProfileService: UserProfileService,
    ) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'isUkrainianCitizen'

    readonly validationRules: ValidationSchema = {
        userIdentifier: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier },
        } = args

        const hasPassport: boolean = await this.userDocumentService.hasOneOfDocuments(userIdentifier, [
            'internal-passport',
            'foreign-passport',
        ])
        if (hasPassport) {
            return true
        }

        const citizenship = await this.userProfileService.getUserCitizenship(userIdentifier, CitizenshipSource.BankAccount)

        return citizenship?.country === 'Ukraine'
    }
}
