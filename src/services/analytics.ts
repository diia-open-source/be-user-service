import { MoleculerService } from '@diia-inhouse/diia-app'

import { AnalyticsActionResult, GetRatingFormParams, GetRatingFormResponse, RateServiceEventPayload } from '@diia-inhouse/analytics'
import { EventBus, InternalEvent } from '@diia-inhouse/diia-queue'
import { ActionVersion, Logger, PlatformType } from '@diia-inhouse/types'

import {
    AnalyticsActionType,
    AnalyticsCategory,
    AnalyticsData,
    AnalyticsHeaders,
    AnalyticsLog,
    GetLastSubmittedRatingParams,
    SubmittedRating,
} from '@interfaces/services/analytics'

export default class AnalyticsService {
    private readonly serviceName = 'Analytics'

    constructor(
        private readonly eventBus: EventBus,
        private readonly logger: Logger,
        private readonly moleculer: MoleculerService,
    ) {}

    log(
        category: AnalyticsCategory,
        userIdentifier: string,
        data: AnalyticsData,
        actionType: AnalyticsActionType,
        headers?: AnalyticsHeaders,
        actionResult: AnalyticsActionResult = AnalyticsActionResult.Success,
    ): void {
        const logMessage: AnalyticsLog = {
            analytics: {
                date: new Date().toISOString(),
                category,
                action: {
                    type: actionType,
                    result: actionResult,
                },
                identifier: userIdentifier,
                data,
            },
        }

        if (headers) {
            const { mobileUid, platformType, platformVersion, appVersion } = headers

            logMessage.analytics.appVersion = appVersion
            logMessage.analytics.device = {
                identifier: mobileUid,
                platform: {
                    type: platformType,
                    version: platformVersion,
                },
            }
        }

        this.logger.info('Analytics', logMessage)
    }

    getHeaders(
        mobileUid?: string,
        platformType?: PlatformType,
        platformVersion?: string,
        appVersion?: string,
    ): AnalyticsHeaders | undefined {
        if (mobileUid && platformType && platformVersion && appVersion) {
            return { mobileUid, platformType, platformVersion, appVersion }
        }
    }

    async getLastSubmittedRating(params: GetLastSubmittedRatingParams): Promise<SubmittedRating | null> {
        return await this.moleculer.act(this.serviceName, { name: 'getLastSubmittedRating', actionVersion: ActionVersion.V1 }, { params })
    }

    async getRatingForm(params: GetRatingFormParams): Promise<GetRatingFormResponse | undefined> {
        const response = await this.moleculer.tryToAct<GetRatingFormResponse>(
            this.serviceName,
            { name: 'getRatingForm', actionVersion: ActionVersion.V2 },
            { params },
        )

        return response
    }

    async notifyRate(payload: RateServiceEventPayload): Promise<void> {
        try {
            await this.eventBus.publish(InternalEvent.RateService, payload)
        } catch (err) {
            this.logger.error('Failed to publish rate service', { err })
        }
    }
}
