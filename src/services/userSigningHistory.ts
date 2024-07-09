import { FilterQuery, UpdateQuery } from '@diia-inhouse/db'
import { NotFoundError } from '@diia-inhouse/errors'

import RatingSigningHistoryService from '@services/rating/signingHistory'

import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'
import UserSigningHistoryDataMapper from '@dataMappers/userSigningHistoryDataMapper'

import { UserSigningHistoryItemModel } from '@interfaces/models/userSigningHistoryItem'
import {
    HistoryItemResponse,
    HistoryResponse,
    HistoryResponseByCode,
    HistoryResponseByCodeV1,
    SigningHistoryItemResponseV1,
    UserHistoryCode,
    UserHistoryItemStatusRecord,
} from '@interfaces/services/userHistory'
import { UpsertItemParams } from '@interfaces/services/userSigningHistory'

export default class UserSigningHistoryService {
    constructor(
        private readonly ratingSigningHistoryService: RatingSigningHistoryService,

        private readonly userHistoryDataMapper: UserHistoryDataMapper,
        private readonly userSigningHistoryDataMapper: UserSigningHistoryDataMapper,
    ) {}

    async upsertItem(item: UpsertItemParams): Promise<void> {
        const { acquirer, recipient, resourceId, userIdentifier, status } = item
        if (!acquirer && !recipient) {
            throw new Error('One of should be provided: "acquirer" or "recipient"')
        }

        const query: FilterQuery<UserSigningHistoryItemModel> = { resourceId, userIdentifier }
        const modifier: UpdateQuery<UserSigningHistoryItemModel> = {
            $set: item,
            $push: { statusHistory: { status, date: new Date() } },
        }

        const signingHistoryItemModel = await userSigningHistoryItemModel.findOneAndUpdate(query, modifier, {
            upsert: true,
            returnDocument: 'after',
        })

        await this.ratingSigningHistoryService.sendRatingPush(signingHistoryItemModel, userIdentifier)
    }

    async getHistory(userIdentifier: string, sessionId: string | undefined, skip: number, limit: number): Promise<HistoryResponse> {
        const query: FilterQuery<UserSigningHistoryItemModel> = { userIdentifier }
        if (sessionId) {
            query.sessionId = sessionId
        }

        const [items, total]: [UserSigningHistoryItemModel[], number] = await Promise.all([
            userSigningHistoryItemModel.find(query).skip(skip).limit(limit).sort({ _id: -1 }),
            userSigningHistoryItemModel.countDocuments(query),
        ])

        return {
            history: items.map((item: UserSigningHistoryItemModel) => this.userSigningHistoryDataMapper.toEntity(item)),
            total,
        }
    }

    async getSigningHistoryByActionV1(
        action: UserHistoryCode,
        userIdentifier: string,
        skip: number,
        limit: number,
    ): Promise<HistoryResponseByCodeV1> {
        const query: FilterQuery<UserSigningHistoryItemModel> = { userIdentifier }

        query.action =
            action === UserHistoryCode.Authorization
                ? 'authDiiaId'
                : {
                      $ne: 'authDiiaId',
                  }

        const [items, total]: [UserSigningHistoryItemModel[], number] = await Promise.all([
            userSigningHistoryItemModel.find(query).skip(skip).limit(limit).sort({ _id: -1 }),
            userSigningHistoryItemModel.countDocuments(query),
        ])

        return {
            items: items.map((item: UserSigningHistoryItemModel) => this.userSigningHistoryDataMapper.toHistoryItemEntityV1(item, action)),
            total,
        }
    }

    async getSigningHistoryByAction(
        action: UserHistoryCode,
        userIdentifier: string,
        skip: number,
        limit: number,
        sessionId?: string,
    ): Promise<HistoryResponseByCode> {
        const query: FilterQuery<UserSigningHistoryItemModel> = { userIdentifier }

        query.action =
            action === UserHistoryCode.Authorization
                ? 'authDiiaId'
                : {
                      $ne: 'authDiiaId',
                  }

        if (sessionId) {
            query.sessionId = sessionId
        }

        const [items, total]: [UserSigningHistoryItemModel[], number] = await Promise.all([
            userSigningHistoryItemModel.find(query).skip(skip).limit(limit).sort({ _id: -1 }),
            userSigningHistoryItemModel.countDocuments(query),
        ])

        return {
            body: items.map((item) => ({ cardMlc: this.userSigningHistoryDataMapper.toHistoryItemEntity(item, action) })),
            total,
        }
    }

    async getHistoryScreenCounts(userIdentifier: string, sessionId?: string): Promise<Partial<Record<UserHistoryCode, number>>> {
        const queryAuthorizationCount: FilterQuery<UserSigningHistoryItemModel> = { userIdentifier, action: 'authDiiaId' }
        const querySigningCount: FilterQuery<UserSigningHistoryItemModel> = { userIdentifier, action: { $ne: 'authDiiaId' } }

        if (sessionId) {
            queryAuthorizationCount.sessionId = sessionId
            querySigningCount.sessionId = sessionId
        }

        const [authorization, signing] = await Promise.all([
            userSigningHistoryItemModel.countDocuments(queryAuthorizationCount),
            userSigningHistoryItemModel.countDocuments(querySigningCount),
        ])

        return {
            authorization,
            signing,
        }
    }

    async getSigningHistoryItemByIdV1(id: string, userIdentifier: string, action: UserHistoryCode): Promise<SigningHistoryItemResponseV1> {
        const query: FilterQuery<UserSigningHistoryItemModel> = { resourceId: id, userIdentifier }
        const signingHistoryItem = await userSigningHistoryItemModel.findOne(query)
        if (!signingHistoryItem) {
            throw new NotFoundError('Signing history item with provided resourceId not found for current user')
        }

        const { platformType, platformVersion, documents } = signingHistoryItem

        const navigationPanel = this.userHistoryDataMapper.getHistoryScreenNavigationPanel()
        const screen = this.userSigningHistoryDataMapper.getHistoryItemV1(signingHistoryItem, action, {
            platformType,
            platformVersion,
            documents,
        })

        const response: SigningHistoryItemResponseV1 = {
            navigationPanel,
            screen,
        }

        const ratingForm = await this.ratingSigningHistoryService.getRatingForm(signingHistoryItem, userIdentifier)
        if (ratingForm) {
            response.ratingForm = ratingForm
        }

        return response
    }

    async getSigningHistoryItemById(
        id: string,
        userIdentifier: string,
        action: UserHistoryCode,
        navigationPanelLabel?: string,
        sessionId?: string,
    ): Promise<HistoryItemResponse> {
        const query: FilterQuery<UserSigningHistoryItemModel> = { resourceId: id, userIdentifier }
        if (sessionId) {
            query.sessionId = sessionId
        }

        const signingHistoryItem = await userSigningHistoryItemModel.findOne(query)
        if (!signingHistoryItem) {
            throw new NotFoundError('Signing history item with provided resourceId not found for current user')
        }

        const { platformType, platformVersion, documents } = signingHistoryItem

        const navigationPanelMlc = this.userHistoryDataMapper.getHistoryScreenNavigationPanelMlc(navigationPanelLabel)
        const body = this.userSigningHistoryDataMapper.getHistoryItem(signingHistoryItem, action, {
            platformType,
            platformVersion,
            documents,
        })

        const response: HistoryItemResponse = {
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc,
                    },
                },
            ],
            body,
        }

        const ratingForm = await this.ratingSigningHistoryService.getRatingForm(signingHistoryItem, userIdentifier)
        if (ratingForm) {
            response.ratingForm = ratingForm
        }

        return response
    }

    async countHistory(userIdentifier: string, sessionId?: string): Promise<number> {
        const query: FilterQuery<UserSigningHistoryItemModel> = { userIdentifier }
        if (sessionId) {
            query.sessionId = sessionId
        }

        const documentsCount = await userSigningHistoryItemModel.countDocuments(query)

        return documentsCount
    }

    async getItemStatuses(resourceIds: string[]): Promise<UserHistoryItemStatusRecord[]> {
        const historyItems = await userSigningHistoryItemModel.find({ resourceId: { $in: resourceIds } }).sort({ _id: -1 })

        return historyItems.map(({ status, resourceId: sharingId, date }) => {
            return { status, sharingId, date }
        })
    }
}
