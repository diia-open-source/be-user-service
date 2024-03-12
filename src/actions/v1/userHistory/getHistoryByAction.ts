import { compare as compareSemver } from 'compare-versions'

import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, PlatformType, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserHistoryService from '@services/userHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userHistory/getHistoryByAction'
import { HistoryAction } from '@interfaces/services/userHistory'

export default class GetHistoryByActionAction implements AppAction {
    constructor(private readonly userHistoryService: UserHistoryService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getHistoryByAction'

    readonly validationRules: ValidationSchema = {
        action: { type: 'string', enum: Object.values(HistoryAction) },
        session: { type: 'string', optional: true },
        skip: { type: 'number', convert: true, optional: true },
        limit: { type: 'number', convert: true, max: 20, optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { action, session, skip = 0, limit = 20 },
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { platformType, appVersion },
        } = args

        if ([PlatformType.Android, PlatformType.Huawei].includes(platformType) && compareSemver(appVersion, '3.0.16', '<')) {
            return { total: 0, history: [] }
        }

        if (platformType === PlatformType.iOS && compareSemver(appVersion, '3.0.20', '<')) {
            return { total: 0, history: [] }
        }

        return await this.userHistoryService.getHistoryByAction(action, userIdentifier, session, skip, limit)
    }
}
