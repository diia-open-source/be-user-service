import { AppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import { ActionResult } from '@interfaces/actions/v1/diiaId/getSigningHistory'

export default class GetDiiaIdSigningHistoryAction implements AppAction {
    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getDiiaIdSigningHistory'

    readonly validationRules: ValidationSchema = {
        skip: { type: 'number', convert: true, optional: true },
        limit: { type: 'number', convert: true, optional: true },
    }

    async handler(): Promise<ActionResult> {
        const [signingRequests, total]: [unknown[], number] = await Promise.all([[], 0])

        return { signingRequests, total }
    }
}
