import { randomUUID } from 'crypto'

import { ObjectId } from 'bson'
import { FilterQuery, UpdateQuery } from 'mongoose'

const userSharingHistoryItemModel = {
    find: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    sort: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
    modelName: 'UserSharingHistoryItem',
}

jest.mock('@models/userSharingHistoryItem', () => userSharingHistoryItemModel)

import TestKit from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import UserSharingHistoryService from '@services/userSharingHistory'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'
import UserSharingHistoryDataMapper from '@dataMappers/userSharingHistoryDataMapper'

import { UserSharingHistoryItemModel } from '@interfaces/models/userSharingHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Service ${UserSharingHistoryService.name}`, () => {
    const testKit = new TestKit()

    const userSharingHistoryDataMapper = new UserSharingHistoryDataMapper(<UserHistoryDataMapper>{})

    const userSharingHistoryService = new UserSharingHistoryService(userSharingHistoryDataMapper, <UserHistoryDataMapper>{})

    const user = testKit.session.getUserSession().user
    const sessionId = randomUUID()

    const userSharingHistoryItem = {
        userIdentifier: user.identifier,
        sessionId,
        sharingId: randomUUID(),
        status: UserHistoryItemStatus.Processing,
        documents: [DocumentType.DriverLicense],
        date: new Date(),
        acquirer: {
            id: new ObjectId(),
            name: 'acquirer',
            address: 'address',
        },
    }

    const now = new Date()

    beforeEach(() => {
        jest.useFakeTimers({ now })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe(`method ${userSharingHistoryService.upsertItem.name}`, () => {
        it('should return user history with sharing action', async () => {
            const query: FilterQuery<UserSharingHistoryItemModel> = { sharingId: userSharingHistoryItem.sharingId }
            const modifier: UpdateQuery<UserSharingHistoryItemModel> = {
                $set: userSharingHistoryItem,
                $push: { statusHistory: { status: userSharingHistoryItem.status, date: now } },
            }

            jest.spyOn(userSharingHistoryItemModel, 'updateOne').mockResolvedValueOnce(true)

            await userSharingHistoryService.upsertItem(userSharingHistoryItem)

            expect(userSharingHistoryItemModel.updateOne).toHaveBeenCalledWith(query, modifier, { upsert: true })
        })
    })

    describe(`method ${userSharingHistoryService.getHistory.name}`, () => {
        it('should return user sharing history items', async () => {
            const query: FilterQuery<UserSharingHistoryItemModel> = { userIdentifier: user.identifier }

            const values = <UserSharingHistoryItemModel[]>[userSharingHistoryItem]

            jest.spyOn(userSharingHistoryItemModel, 'find').mockReturnThis()
            jest.spyOn(userSharingHistoryItemModel, 'skip').mockReturnThis()
            jest.spyOn(userSharingHistoryItemModel, 'limit').mockReturnThis()
            jest.spyOn(userSharingHistoryItemModel, 'sort').mockResolvedValueOnce(values)
            jest.spyOn(userSharingHistoryItemModel, 'countDocuments').mockResolvedValueOnce(1)

            const mappedHistory = {
                id: userSharingHistoryItem.sharingId,
                status: UserHistoryItemStatus.Processing,
                date: userSharingHistoryItem.date.toString(),
                documents: [DocumentType.DriverLicense],
                recipient: { name: userSharingHistoryItem.acquirer.name, address: userSharingHistoryItem.acquirer.address },
                purpose: 'purpose',
            }

            jest.spyOn(userSharingHistoryDataMapper, 'toEntity').mockReturnValueOnce(mappedHistory)

            const result = { history: [mappedHistory], total: 1 }

            expect(await userSharingHistoryService.getHistory(user.identifier, sessionId, 1, 10)).toMatchObject(result)
            expect(userSharingHistoryItemModel.countDocuments).toHaveBeenCalledWith({ ...query, sessionId })
            expect(userSharingHistoryDataMapper.toEntity).toHaveBeenCalledWith(values[0])
        })
    })

    describe(`method ${userSharingHistoryService.countHistory.name}`, () => {
        it('should return count of user sharing history documents', async () => {
            const query: FilterQuery<UserSharingHistoryItemModel> = { userIdentifier: user.identifier }

            jest.spyOn(userSharingHistoryItemModel, 'countDocuments').mockReturnValueOnce(1)

            expect(await userSharingHistoryService.countHistory(user.identifier, sessionId)).toBe(1)
            expect(userSharingHistoryItemModel.countDocuments).toHaveBeenCalledWith({ ...query, sessionId })
        })
    })

    describe(`method ${userSharingHistoryService.getItemStatuses.name}`, () => {
        it('should return user sharing history item statuses', async () => {
            const historyItems = [userSharingHistoryItem]

            jest.spyOn(userSharingHistoryItemModel, 'find').mockReturnThis()
            jest.spyOn(userSharingHistoryItemModel, 'sort').mockResolvedValueOnce(historyItems)

            expect(await userSharingHistoryService.getItemStatuses(['id'])).toMatchObject([
                { status: historyItems[0].status, sharingId: historyItems[0].sharingId, date: historyItems[0].date },
            ])
        })
    })
})
