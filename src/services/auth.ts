import { MoleculerService } from '@diia-inhouse/diia-app'

import { AuthServiceClient, SessionByIdResponse } from '@diia-inhouse/auth-service-client'
import { ActionVersion, AppUser } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import { AuthSchemaCode, RevokeSubmitAfterUserAuthStepsResult } from '@interfaces/services/auth'

export default class AuthService {
    private readonly serviceName = 'Auth'

    constructor(
        private readonly moleculer: MoleculerService,
        private readonly authServiceClient: AuthServiceClient,
    ) {}

    async completeUserAuthSteps(user: AppUser, schemaCode: AuthSchemaCode, processId: string): Promise<void> {
        return await this.moleculer.act(
            this.serviceName,
            {
                name: 'completeUserAuthSteps',
                actionVersion: ActionVersion.V1,
            },
            {
                params: { schemaCode, processId },
                session: utils.makeSession(user),
            },
        )
    }

    async revokeSubmitAfterUserAuthSteps(
        mobileUid: string,
        userIdentifier: string,
        schemaCode: AuthSchemaCode,
    ): Promise<RevokeSubmitAfterUserAuthStepsResult> {
        return await this.moleculer.act(
            this.serviceName,
            {
                name: 'revokeSubmitAfterUserAuthSteps',
                actionVersion: ActionVersion.V1,
            },
            {
                params: { mobileUid, userIdentifier, code: schemaCode },
            },
        )
    }

    async getSessionById(sessionId: string, userIdentifier: string): Promise<SessionByIdResponse> {
        return await this.authServiceClient.getSessionById({ id: sessionId, userIdentifier })
    }
}
