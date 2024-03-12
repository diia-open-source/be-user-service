import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserProfileService from '@services/userProfile'

import { ActionResult, EventPayload } from '@interfaces/externalEventListeners/getUserInfoForFilters'

export default class GetUserInfoForFiltersAction implements EventBusListener {
    constructor(private readonly userProfileService: UserProfileService) {}

    readonly event: ExternalEvent = ExternalEvent.UserGetInfoForFilters

    readonly validationRules: ValidationSchema = {
        uuid: { type: 'uuid' },
        request: {
            type: 'object',
            props: {
                userIdentifier: { type: 'string' },
            },
        },
    }

    async handler(payload: EventPayload): Promise<ActionResult> {
        const { userIdentifier } = payload.request

        return await this.userProfileService.getUserFilterInfo(userIdentifier)
    }
}
