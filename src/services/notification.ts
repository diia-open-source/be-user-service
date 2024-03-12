import { ObjectId } from 'bson'

import { MoleculerService } from '@diia-inhouse/diia-app'

import { NotificationServiceClient } from '@diia-inhouse/notification-service-client'
import { ActHeaders, ActionVersion, Logger, SessionType, UserTokenData } from '@diia-inhouse/types'

import {
    CreateNotificationWithPushesByMobileUidParams,
    CreateNotificationWithPushesParams,
    PushNotificationCampaignEstimations,
    SmsTemplateCode,
} from '@interfaces/services/notification'

export default class NotificationService {
    private readonly serviceName = 'Notification'

    constructor(
        private readonly moleculer: MoleculerService,
        private readonly logger: Logger,
        private readonly notificationServiceClient: NotificationServiceClient,
    ) {}

    async isMessageExists(messageId: ObjectId): Promise<boolean> {
        return await this.moleculer.act(
            this.serviceName,
            {
                name: 'isMessageExists',
                actionVersion: ActionVersion.V1,
            },
            {
                params: { messageId },
            },
        )
    }

    async isSilentActionExists(actionType: string): Promise<boolean> {
        return await this.moleculer.act(
            this.serviceName,
            {
                name: 'isSilentActionExists',
                actionVersion: ActionVersion.V1,
            },
            {
                params: { actionType },
            },
        )
    }

    async sendSms(
        phoneNumber: string,
        smsCode: SmsTemplateCode,
        user: UserTokenData,
        headers: ActHeaders,
        valueToInsert?: string,
    ): Promise<boolean> {
        return await this.moleculer.act(
            this.serviceName,
            {
                name: 'sendSms',
                actionVersion: ActionVersion.V1,
            },
            {
                params: { phoneNumber, smsCode, valueToInsert },
                session: { sessionType: SessionType.User, user },
                headers,
            },
        )
    }

    async createNotificationWithPushes(params: CreateNotificationWithPushesParams): Promise<void> {
        await this.notificationServiceClient.createNotificationWithPushes(params)
    }

    async createNotificationWithPushesSafe(params: CreateNotificationWithPushesParams): Promise<void> {
        try {
            await this.createNotificationWithPushes(params)
        } catch (err) {
            this.logger.error('Failed to exec createNotificationWithPushes', { err, params })
        }
    }

    async createNotificationWithPushesByMobileUid(params: CreateNotificationWithPushesByMobileUidParams): Promise<void> {
        await this.notificationServiceClient.createNotificationWithPushesByMobileUid(params)
    }

    async createNotificationWithPushesByMobileUidSafe(params: CreateNotificationWithPushesByMobileUidParams): Promise<void> {
        try {
            await this.createNotificationWithPushesByMobileUid(params)
        } catch (err) {
            this.logger.error('Failed to exec createNotificationWithPushesByMobileUid', { err, params })
        }
    }

    topicIdentifierByTotal(total: number, topicsBatch: number): string {
        if (!topicsBatch) {
            return ''
        }

        return `${Math.floor(total / topicsBatch)}`
    }

    async setSubscriptionBatches(campaignEstimation: PushNotificationCampaignEstimations): Promise<void> {
        return await this.moleculer.act(
            this.serviceName,
            {
                name: 'setSubscriptionBatches',
                actionVersion: ActionVersion.V1,
            },
            { params: campaignEstimation },
        )
    }
}
