import { FilterQuery, UpdateQuery } from '@diia-inhouse/db'
import { NotFoundError } from '@diia-inhouse/errors'

import DocumentsService from '@services/documents'

import userSharingHistoryItemModel from '@models/userSharingHistoryItem'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'
import UserSharingHistoryDataMapper from '@dataMappers/userSharingHistoryDataMapper'

import { UserSharingHistoryItemModel } from '@interfaces/models/userSharingHistoryItem'
import {
    HistoryItemResponse,
    HistoryResponse,
    HistoryResponseByCode,
    UserHistoryCode,
    UserHistoryItemStatusRecord,
} from '@interfaces/services/userHistory'
import { UpsertItemParams } from '@interfaces/services/userSharingHistory'

export default class UserSharingHistoryService {
    constructor(
        private readonly documentsService: DocumentsService,
        private readonly userSharingHistoryDataMapper: UserSharingHistoryDataMapper,
        private readonly userHistoryDataMapper: UserHistoryDataMapper,
    ) {}

    async upsertItem(item: UpsertItemParams): Promise<void> {
        const { sharingId, status } = item
        const query: FilterQuery<UserSharingHistoryItemModel> = { sharingId }
        const modifier: UpdateQuery<UserSharingHistoryItemModel> = {
            $set: item,
            $push: { statusHistory: { status, date: new Date() } },
        }

        await userSharingHistoryItemModel.updateOne(query, modifier, { upsert: true })
    }

    async getHistory(userIdentifier: string, sessionId: string | undefined, skip: number, limit: number): Promise<HistoryResponse> {
        const query: FilterQuery<UserSharingHistoryItemModel> = { userIdentifier }
        if (sessionId) {
            query.sessionId = sessionId
        }

        const [items, total]: [UserSharingHistoryItemModel[], number] = await Promise.all([
            userSharingHistoryItemModel.find(query).skip(skip).limit(limit).sort({ _id: -1 }),
            userSharingHistoryItemModel.countDocuments(query),
        ])
        const history = await Promise.all(
            items.map(async (item) => {
                const { documents } = item
                const documentsNames = await this.documentsService.getDocumentNames(documents)

                return this.userSharingHistoryDataMapper.toEntity(item, documentsNames)
            }),
        )

        return { history, total }
    }

    async countHistory(userIdentifier: string, sessionId?: string | undefined): Promise<number> {
        const query: FilterQuery<UserSharingHistoryItemModel> = { userIdentifier }
        if (sessionId) {
            query.sessionId = sessionId
        }

        return await userSharingHistoryItemModel.countDocuments(query)
    }

    async getItemStatuses(sharingIds: string[]): Promise<UserHistoryItemStatusRecord[]> {
        const historyItems = await userSharingHistoryItemModel.find({ sharingId: { $in: sharingIds } }).sort({ _id: -1 })

        return historyItems.map(({ status, sharingId, date }) => {
            return { status, sharingId, date }
        })
    }

    async getSharingHistoryItemById(
        itemId: string,
        userIdentifier: string,
        action: UserHistoryCode,
        navigationPanelLabel?: string,
        sessionId?: string,
    ): Promise<HistoryItemResponse> {
        const query: FilterQuery<UserSharingHistoryItemModel> = { sharingId: itemId, userIdentifier }
        if (sessionId) {
            query.sessionId = sessionId
        }

        const sharingHistoryItem = await userSharingHistoryItemModel.findOne(query)
        if (!sharingHistoryItem) {
            throw new NotFoundError('Sharing history item with provided sharingId not found for current user')
        }

        const { documents } = sharingHistoryItem

        const documentsNames = await this.documentsService.getDocumentNames(documents)
        const body = this.userSharingHistoryDataMapper.getHistoryItem(sharingHistoryItem, documentsNames, action)
        const navigationPanelMlc = this.userHistoryDataMapper.getHistoryScreenNavigationPanelMlc(navigationPanelLabel)

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

        return response
    }

    async getSharingHistoryByAction(
        action: UserHistoryCode,
        userIdentifier: string,
        skip: number,
        limit: number,
        sessionId?: string,
    ): Promise<HistoryResponseByCode> {
        const query: FilterQuery<UserSharingHistoryItemModel> = { userIdentifier, sessionId }

        const [items, total] = await Promise.all([
            userSharingHistoryItemModel.find(query).skip(skip).limit(limit).sort({ _id: -1 }),
            userSharingHistoryItemModel.countDocuments(query),
        ])

        return {
            body: [
                {
                    paginationListOrg: {
                        componentId: 'pagination_list_org',
                        items: items.map((item) => ({ cardMlc: this.userSharingHistoryDataMapper.toHistoryItemEntity(item, action) })),
                        limit: 20,
                    },
                },
            ],
            total,
        }
    }
}
