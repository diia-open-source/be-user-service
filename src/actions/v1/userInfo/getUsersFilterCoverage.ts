import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, DocumentType, Gender, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userInfo/getUsersFilterCoverage'

export default class GetUsersFilterCoveragesAction implements AppAction {
    constructor(private readonly userProfileService: UserProfileService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getUsersFilterCoverage'

    readonly validationRules: ValidationSchema = {
        filter: {
            type: 'object',
            props: {
                gender: { type: 'string', enum: Object.values(Gender), optional: true },
                childrenAmount: { type: 'number', optional: true },
                age: {
                    type: 'object',
                    optional: true,
                    props: {
                        from: { type: 'number', optional: true },
                        to: { type: 'number', optional: true },
                    },
                },
                address: {
                    type: 'object',
                    optional: true,
                    props: {
                        regionId: { type: 'string' },
                        atuId: { type: 'string', optional: true },
                    },
                },
                documents: {
                    type: 'array',
                    optional: true,
                    items: {
                        type: 'object',
                        props: {
                            type: { type: 'string', enum: Object.values(DocumentType) },
                        },
                    },
                },
            },
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const { filter } = args.params

        return await this.userProfileService.getFilterCoverage(filter)
    }
}
