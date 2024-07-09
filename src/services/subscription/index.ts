import { IdentifierService } from '@diia-inhouse/crypto'
import { FilterQuery, UpdateQuery } from '@diia-inhouse/db'
import { BadRequestError, ModelNotFoundError, NotFoundError } from '@diia-inhouse/errors'
import { Logger, UserActionHeaders } from '@diia-inhouse/types'

import AnalyticsService from '@services/analytics'
import CreditHistoryStrategyService from '@services/subscription/strategies/creditHistory'
import PublicServiceStrategyService from '@services/subscription/strategies/publicService'
import UserDocumentService from '@services/userDocument'

import subscriptionModel from '@models/subscription'

import SubscriptionDataMapper from '@dataMappers/subscriptionDataMapper'

import { AppConfig } from '@interfaces/config'
import { PublicServiceCode, Subscription, SubscriptionModel, SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'
import { CreditHistoryProvider } from '@interfaces/providers/creditHistory'
import { AnalyticsActionType, AnalyticsCategory, AnalyticsData, AnalyticsHeaders } from '@interfaces/services/analytics'
import { UserProfileDocument } from '@interfaces/services/documents'
import {
    SubscribeDocumentsParams,
    SubscriptionCode,
    SubscriptionParams,
    SubscriptionStrategy,
    SubscriptionsResponse,
} from '@interfaces/services/subscription'

export default class SubscriptionService {
    readonly debtsSalt: string | undefined

    private readonly subscriptionStrategyByCode: Record<SubscriptionCode, SubscriptionStrategy | null>

    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly userDocumentService: UserDocumentService,
        private readonly subscriptionDataMapper: SubscriptionDataMapper,
        private readonly creditHistoryProvider: CreditHistoryProvider,

        private readonly config: AppConfig,
        private readonly identifier: IdentifierService,
        private readonly logger: Logger,
    ) {
        this.debtsSalt = this.config.subscription.debtsSalt

        this.subscriptionStrategyByCode = {
            [SubscriptionCode.CreditHistory]: new CreditHistoryStrategyService(this.creditHistoryProvider, this.logger),
            [SubscriptionCode.PublicService]: new PublicServiceStrategyService(),
            [SubscriptionCode.Debts]: null,
        }
    }

    async getSubscriptions(userIdentifier: string, itn: string, headers: UserActionHeaders): Promise<SubscriptionsResponse> {
        const query: FilterQuery<SubscriptionModel> = { userIdentifier }

        const userSubscription = (await subscriptionModel.findOne(query)) || (await this.createInitialSubscription(userIdentifier, itn))

        return this.subscriptionDataMapper.toSubscriptionsResponse(userSubscription, headers)
    }

    async subscribe(params: SubscriptionParams): Promise<void> {
        const { userIdentifier, code } = params
        const subscription: SubscriptionModel = await this.getUserSubscription(userIdentifier)
        const strategy: SubscriptionStrategy | null = this.subscriptionStrategyByCode[code]
        if (!strategy) {
            throw new BadRequestError(`Provided code is not supported yet: ${code}`)
        }

        const modifier: UpdateQuery<SubscriptionModel> | void = await strategy.subscribe(subscription, params)
        if (!modifier) {
            this.logger.warn('Subscription modifier is empty', { code })

            return
        }

        const query: FilterQuery<SubscriptionModel> = { userIdentifier }

        await subscriptionModel.updateOne(query, modifier)
    }

    async unsubscribe(params: SubscriptionParams): Promise<void> {
        const { userIdentifier, code } = params
        const subscription: SubscriptionModel = await this.getUserSubscription(userIdentifier)
        const strategy: SubscriptionStrategy | null = this.subscriptionStrategyByCode[code]
        if (!strategy?.unsubscribe) {
            throw new BadRequestError(`Provided code is not supported yet: ${code}`)
        }

        const modifier: UpdateQuery<SubscriptionModel> | void = await strategy.unsubscribe(subscription, params)
        if (!modifier) {
            this.logger.warn('Unsubscription modifier is empty', { code })

            return
        }

        const query: FilterQuery<SubscriptionModel> = { userIdentifier }

        await subscriptionModel.updateOne(query, modifier)
    }

    async getSubscribedSegments(userIdentifier: string): Promise<string[]> {
        const subscription = await subscriptionModel.findOne({ userIdentifier })
        const subscribedSegments = subscription?.[SubscriptionType.Segment]?.[SubscriptionSubType.PublicServices]
        if (!subscribedSegments) {
            return []
        }

        return subscribedSegments
    }

    async setDocumentsSubscription({
        userIdentifier,
        subscriptionType,
        documentType,
        documentSubscriptionId,
        isSubscribed,
        headers,
    }: SubscribeDocumentsParams): Promise<void> {
        const documentIdentifier: string = this.identifier.createIdentifier(documentSubscriptionId)
        const isValidUserDocument: boolean = await this.userDocumentService.validateUserDocument(
            userIdentifier,
            documentType,
            documentIdentifier,
        )
        if (!isValidUserDocument) {
            throw new NotFoundError('User has not this document')
        }

        const modifier: Record<string, boolean> = {
            [`${subscriptionType}.${SubscriptionSubType.Documents}.${documentType}.${documentIdentifier}`]: isSubscribed,
        }

        await subscriptionModel.updateOne({ userIdentifier }, modifier, { upsert: true })

        const data: AnalyticsData = { subscriptionType, documentType, documentId: documentIdentifier }
        const actionType: AnalyticsActionType = isSubscribed
            ? AnalyticsActionType.AddDocumentSubscription
            : AnalyticsActionType.RemoveDocumentSubscription

        this.analyticsService.log(AnalyticsCategory.Users, userIdentifier, data, actionType, headers)
    }

    async setPublicServiceSubscriptions(userIdentifier: string, itn: string): Promise<void> {
        const query: FilterQuery<SubscriptionModel> = { userIdentifier }
        const creditHistoryStrategyService = this.subscriptionStrategyByCode[SubscriptionCode.CreditHistory]

        const subscription = (await subscriptionModel.findOne(query)) || (await this.createInitialSubscription(userIdentifier, itn))

        if (!creditHistoryStrategyService?.publishSubscription) {
            this.logger.warn('Missing creditHistoryStrategyService')

            return
        }

        await creditHistoryStrategyService.publishSubscription(subscription, {
            userIdentifier,
            itn,
            code: SubscriptionCode.CreditHistory,
            autoSubscribe: true,
        })
    }

    async updateDocumentsSubscriptions(
        userIdentifier: string,
        documentType: string,
        documents: UserProfileDocument[],
        headers?: AnalyticsHeaders,
    ): Promise<void> {
        const subscription = await subscriptionModel.findOne({ userIdentifier })
        if (!subscription) {
            return
        }

        const unsetModifier: Record<string, 1> = {}

        const subscriptionType: SubscriptionType = SubscriptionType.Push

        for (const subscriptionIdentifier of Object.keys(subscription[subscriptionType].documents[documentType] || {})) {
            const isDocStillAvailable = documents.some(({ documentIdentifier }) => subscriptionIdentifier === documentIdentifier)

            if (!isDocStillAvailable) {
                unsetModifier[`${subscriptionType}.${SubscriptionSubType.Documents}.${documentType}.${subscriptionIdentifier}`] = 1
                const data: AnalyticsData = {
                    subscriptionType,
                    documentType,
                    documentId: subscriptionIdentifier,
                }

                this.analyticsService.log(
                    AnalyticsCategory.Users,
                    userIdentifier,
                    data,
                    AnalyticsActionType.RemoveDocumentSubscription,
                    headers,
                )
            }
        }

        if (Object.keys(unsetModifier).length > 0) {
            await subscriptionModel.updateOne({ userIdentifier }, { $unset: unsetModifier })
        }
    }

    async getSubscribedUserIdentifier(
        subscriptionType: SubscriptionType,
        publicServiceCode: PublicServiceCode,
        subscriptionKey: string,
    ): Promise<string | undefined> {
        const query: FilterQuery<SubscriptionModel> = {
            [`${subscriptionType}.${SubscriptionSubType.PublicServices}.${publicServiceCode}.${subscriptionKey}`]: true,
        }

        const userSubscription = await subscriptionModel.findOne(query)
        if (userSubscription) {
            return userSubscription.userIdentifier
        }

        this.logger.info('No subscribed users', { subscriptionType, publicServiceCode, subscriptionKey })
    }

    async isSubscribed(userIdentifier: string, publicServiceCode: PublicServiceCode, subscriptionKeyParam?: string): Promise<boolean> {
        const subscriptionKey: string = subscriptionKeyParam || userIdentifier
        const query: FilterQuery<SubscriptionModel> = {
            userIdentifier,
            [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${publicServiceCode}.${subscriptionKey}`]: true,
        }
        const count: number = await subscriptionModel.countDocuments(query)

        return count > 0
    }

    private async createInitialSubscription(userIdentifier: string, itn: string): Promise<SubscriptionModel> {
        const data: Subscription = {
            userIdentifier,
            subscriptionIds: {},
            [SubscriptionType.Push]: {
                [SubscriptionSubType.Documents]: {},
                [SubscriptionSubType.PublicServices]: {
                    [PublicServiceCode.Debts]: {
                        [this.identifier.createIdentifier(itn, { customSalt: this.debtsSalt })]: true,
                    },
                    [PublicServiceCode.CreditHistory]: {
                        [userIdentifier]: false,
                    },
                },
            },
            [SubscriptionType.Segment]: {
                [SubscriptionSubType.PublicServices]: [],
            },
        }

        return await subscriptionModel.create(data)
    }

    async getSubscribedDocuments(
        userIdentifier: string,
        subscriptionType: SubscriptionType.Push,
        documentType: string,
    ): Promise<string[] | undefined> {
        const subscription = await subscriptionModel.findOne({ userIdentifier })
        if (!subscription) {
            return
        }

        const documentTypeSubscription = subscription[subscriptionType]?.[SubscriptionSubType.Documents]?.[documentType]
        if (!documentTypeSubscription) {
            return []
        }

        const subscribedDocumentIdentifiers: string[] = []

        for (const [documentIdentifier, subscriptionByDocumentType] of Object.entries(documentTypeSubscription)) {
            if (subscriptionByDocumentType) {
                subscribedDocumentIdentifiers.push(documentIdentifier)
            }
        }

        return subscribedDocumentIdentifiers
    }

    async updateByUserIdentifier(userIdentifier: string, modifier: UpdateQuery<SubscriptionModel>): Promise<void> {
        const query: FilterQuery<SubscriptionModel> = { userIdentifier }

        const { modifiedCount } = await subscriptionModel.updateOne(query, modifier)
        if (modifiedCount === 0) {
            throw new ModelNotFoundError(subscriptionModel.collection.name, userIdentifier)
        }
    }

    private async getUserSubscription(userIdentifier: string): Promise<SubscriptionModel> {
        const query: FilterQuery<SubscriptionModel> = { userIdentifier }
        const userSubscription = await subscriptionModel.findOne(query)
        if (!userSubscription) {
            throw new ModelNotFoundError(subscriptionModel.modelName, '')
        }

        return userSubscription
    }
}
