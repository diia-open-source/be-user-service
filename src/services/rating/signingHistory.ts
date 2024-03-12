import { DateTime } from 'luxon'

import { DiiaIdServiceCode, RateServiceEventPayload, RatingCategory, RatingForm, RatingService } from '@diia-inhouse/analytics'
import { MessageActionSubtype, MessageActionType, PlatformType, TemplateStub } from '@diia-inhouse/types'

import AnalyticsService from '@services/analytics'

import { Action, UserSigningHistoryItemModel } from '@interfaces/models/userSigningHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export default class RatingSigningHistoryService implements RatingService<UserSigningHistoryItemModel> {
    private readonly daysAfterLastRatingSubmitThreshold = 30

    private readonly allowedStatuses: UserHistoryItemStatus[] = [UserHistoryItemStatus.Done]

    constructor(private readonly analyticsService: AnalyticsService) {}

    async sendRatingPush(
        signingHistoryItemModel: UserSigningHistoryItemModel,
        userIdentifier: string,
        params?: Partial<RateServiceEventPayload>,
    ): Promise<void> {
        if (!this.isRatingAvailable(signingHistoryItemModel)) {
            return
        }

        const { action, resourceId } = signingHistoryItemModel

        const category = RatingCategory.DiiaId
        const serviceCode = this.getServiceCodeByAction(action)

        const lastSubmittedRating = await this.analyticsService.getLastSubmittedRating({
            userIdentifier,
            category,
            serviceCode,
        })

        if (lastSubmittedRating) {
            const ratedDaysAgo = DateTime.now().diff(DateTime.fromISO(lastSubmittedRating.ratedAt), 'days').days
            if (ratedDaysAgo <= this.daysAfterLastRatingSubmitThreshold) {
                return
            }
        }

        const actionSubtypeByServiceCode: Record<DiiaIdServiceCode, MessageActionSubtype> = {
            [DiiaIdServiceCode.Authorization]: MessageActionSubtype.authorization,
            [DiiaIdServiceCode.Signing]: MessageActionSubtype.signing,
        }

        await this.analyticsService.notifyRate({
            userIdentifier,
            category,
            serviceCode,
            resourceId,
            notificationParams: {
                templateParams: { [TemplateStub.ShortText]: 'Поділіться враженнями та досвідом використання Дія.Підпису.' },
                action: {
                    type: MessageActionType.DiiaId,
                    subtype: actionSubtypeByServiceCode[serviceCode],
                },
                appVersions: {
                    [PlatformType.iOS]: { minVersion: '3.0.65.1285' },
                    [PlatformType.Android]: { minVersion: '3.0.74.1234' },
                    [PlatformType.Huawei]: { minVersion: '3.0.74.1234' },
                },
            },
            ...params,
        })
    }

    async getRatingForm(
        signingHistoryItemModel: UserSigningHistoryItemModel,
        userIdentifier: string,
        params?: Partial<RateServiceEventPayload>,
    ): Promise<RatingForm<string> | undefined> {
        if (!this.isRatingAvailable(signingHistoryItemModel)) {
            return
        }

        const { resourceId, action, statusHistory } = signingHistoryItemModel
        const lastStatusItem = statusHistory.at(-1)

        const ratingFormResponse = await this.analyticsService.getRatingForm({
            userIdentifier,
            category: RatingCategory.DiiaId,
            serviceCode: this.getServiceCodeByAction(action),
            statusDate: lastStatusItem!.date,
            resourceId,
            hasRatingSubmitThreshold: true,
            daysAfterLastRatingSubmitThreshold: this.daysAfterLastRatingSubmitThreshold,
            ...params,
        })

        if (ratingFormResponse) {
            return ratingFormResponse.ratingForm
        }

        return
    }

    private getServiceCodeByAction(action?: Action): DiiaIdServiceCode {
        return action === 'authDiiaId' ? DiiaIdServiceCode.Authorization : DiiaIdServiceCode.Signing
    }

    private isRatingAvailable(userSigningHistoryItemModel: UserSigningHistoryItemModel): boolean {
        const { status, publicService } = userSigningHistoryItemModel

        return this.allowedStatuses.includes(status) && !publicService
    }
}
