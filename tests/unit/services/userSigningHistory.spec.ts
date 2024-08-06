import { randomUUID } from 'node:crypto'

const userSigningHistoryItemModelMock = {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn(),
    sort: jest.fn(),
    updateOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    modelName: 'UserDocument',
}

jest.mock('@models/userSigningHistoryItem', () => ({
    ...jest.requireActual('@models/userSigningHistoryItem'),
    default: userSigningHistoryItemModelMock,
    __esModule: true,
}))

import { DiiaIdServiceCode } from '@diia-inhouse/analytics'
import { mongo } from '@diia-inhouse/db'
import { NotFoundError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import {
    ButtonState,
    ChipStatusAtmType,
    ContentType,
    DurationMs,
    MessageBodyItemType,
    PlatformType,
    PublicServiceContextMenuType,
} from '@diia-inhouse/types'

import RatingSigningHistoryService from '@services/rating/signingHistory'
import UserSigningHistoryService from '@services/userSigningHistory'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'
import UserSigningHistoryDataMapper from '@dataMappers/userSigningHistoryDataMapper'

import { PublicServiceCode } from '@interfaces/models/subscription'
import { UserSigningHistoryItem, UserSigningHistoryItemModel } from '@interfaces/models/userSigningHistoryItem'
import { HistoryResponseByCode, UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'
import { UpsertItemParams } from '@interfaces/services/userSigningHistory'

const undefinedValue = undefined

describe(`Service ${UserSigningHistoryService.name}`, () => {
    const testKit = new TestKit()
    const ratingSigningHistoryService = mockInstance(RatingSigningHistoryService)
    const userHistoryDataMapper = new UserHistoryDataMapper()
    const userSigningHistoryDataMapper = new UserSigningHistoryDataMapper(userHistoryDataMapper)

    const service = new UserSigningHistoryService(ratingSigningHistoryService, userHistoryDataMapper, userSigningHistoryDataMapper)
    const { user } = testKit.session.getUserSession()

    describe(`method ${service.upsertItem.name}`, () => {
        it('should upsert signing history item', async () => {
            const userIdentifier = randomUUID()
            const resourceId = randomUUID()
            const status = UserHistoryItemStatus.Processing
            const item: UpsertItemParams = {
                userIdentifier,
                resourceId,
                status,
                sessionId: randomUUID(),
                documents: [randomUUID()],
                date: new Date(),
                acquirer: { id: new mongo.ObjectId(), name: randomUUID(), address: randomUUID() },
                recipient: { name: randomUUID(), address: randomUUID() },
                publicService: PublicServiceCode.CreditHistory,
            }
            const signingHistoryItemModel = {}

            userSigningHistoryItemModelMock.findOneAndUpdate.mockResolvedValueOnce(signingHistoryItemModel)
            jest.spyOn(ratingSigningHistoryService, 'sendRatingPush').mockResolvedValueOnce()

            await service.upsertItem(item)

            expect(userSigningHistoryItemModelMock.findOneAndUpdate).toHaveBeenCalledWith(
                { resourceId, userIdentifier },
                {
                    $set: item,
                    $push: { statusHistory: { status, date: expect.any(Date) } },
                },
                { returnDocument: 'after', upsert: true },
            )
            expect(ratingSigningHistoryService.sendRatingPush).toHaveBeenCalledWith(signingHistoryItemModel, userIdentifier)
        })

        it('should throw error if acquirer and recipient were not passed', async () => {
            const userIdentifier = randomUUID()
            const resourceId = randomUUID()
            const status = UserHistoryItemStatus.Done
            const item: UpsertItemParams = {
                userIdentifier,
                resourceId,
                status,
                sessionId: randomUUID(),
                documents: [randomUUID()],
                date: new Date(),
                publicService: PublicServiceCode.CreditHistory,
            }

            await expect(service.upsertItem(item)).rejects.toThrow(new Error('One of should be provided: "acquirer" or "recipient"'))
        })
    })

    describe(`method: ${service.getHistory.name}`, () => {
        it.each([
            ['sessionId was not passed', { skip: 0, limit: 100 }],
            ['sessionId was passed', { skip: 13, limit: 13, sessionId: randomUUID() }],
        ])(
            'should return history items and items total when %s',
            async (_msg, params: { sessionId?: string; skip: number; limit: number }) => {
                const userIdentifier = randomUUID()
                const { sessionId, skip, limit } = params
                const historyItems: UserSigningHistoryItem[] = [
                    {
                        userIdentifier: randomUUID(),
                        sessionId: randomUUID(),
                        resourceId: randomUUID(),
                        status: UserHistoryItemStatus.Refuse,
                        statusHistory: [{ status: UserHistoryItemStatus.Processing, date: new Date(Date.now() - DurationMs.Day) }],
                        documents: [randomUUID()],
                        date: new Date(),
                        recipient: { name: randomUUID(), address: randomUUID() },
                        publicService: PublicServiceCode.Debts,
                    },
                    {
                        userIdentifier: randomUUID(),
                        sessionId: randomUUID(),
                        resourceId: randomUUID(),
                        status: UserHistoryItemStatus.Done,
                        statusHistory: [{ status: UserHistoryItemStatus.Processing, date: new Date(Date.now() - DurationMs.Day * 2) }],
                        documents: [randomUUID()],
                        date: new Date(),
                        recipient: { name: randomUUID(), address: randomUUID() },
                        publicService: PublicServiceCode.CreditHistory,
                    },
                ]

                userSigningHistoryItemModelMock.find.mockReturnValueOnce(userSigningHistoryItemModelMock)
                userSigningHistoryItemModelMock.skip.mockReturnValueOnce(userSigningHistoryItemModelMock)
                userSigningHistoryItemModelMock.limit.mockReturnValueOnce(userSigningHistoryItemModelMock)
                userSigningHistoryItemModelMock.sort.mockReturnValueOnce(historyItems)
                userSigningHistoryItemModelMock.countDocuments.mockReturnValueOnce(historyItems.length)

                const result = await service.getHistory(userIdentifier, sessionId, skip, limit)

                expect(userSigningHistoryItemModelMock.find).toHaveBeenCalledWith({ userIdentifier, sessionId })
                expect(userSigningHistoryItemModelMock.skip).toHaveBeenCalledWith(skip)
                expect(userSigningHistoryItemModelMock.limit).toHaveBeenCalledWith(limit)
                expect(userSigningHistoryItemModelMock.sort).toHaveBeenCalledWith({ _id: -1 })
                expect(userSigningHistoryItemModelMock.countDocuments).toHaveBeenCalledWith({ userIdentifier, sessionId })
                expect(result).toEqual({
                    total: historyItems.length,
                    history: historyItems.map(({ documents, resourceId, recipient, status }) => ({
                        date: expect.any(String),
                        id: resourceId,
                        documents,
                        recipient,
                        status,
                    })),
                })
            },
        )
    })

    describe(`method: ${service.getSigningHistoryByActionV1.name}`, () => {
        it.each([
            [`action is ${UserHistoryCode.Authorization}`, UserHistoryCode.Authorization, { action: 'authDiiaId' }],
            [`action is ${UserHistoryCode.Signing}`, UserHistoryCode.Signing, { action: { $ne: 'authDiiaId' } }],
        ])('should return history items and items total by action when %s', async (_msg, action, queryModifier) => {
            const userIdentifier = randomUUID()
            const skip = testKit.random.getRandomInt(0, 10)
            const limit = testKit.random.getRandomInt(1, 100)
            const historyItems = [
                {
                    userIdentifier: randomUUID(),
                    sessionId: randomUUID(),
                    resourceId: randomUUID(),
                    status: UserHistoryItemStatus.Refuse,
                    statusHistory: [{ status: UserHistoryItemStatus.Processing, date: new Date(Date.now() - DurationMs.Day) }],
                    documents: [randomUUID()],
                    date: new Date(),
                    recipient: { name: randomUUID(), address: randomUUID() },
                    publicService: PublicServiceCode.Debts,
                },
                {
                    userIdentifier: randomUUID(),
                    sessionId: randomUUID(),
                    resourceId: randomUUID(),
                    status: UserHistoryItemStatus.Done,
                    statusHistory: [{ status: UserHistoryItemStatus.Processing, date: new Date(Date.now() - DurationMs.Day * 2) }],
                    documents: [randomUUID()],
                    date: new Date(),
                    recipient: { name: randomUUID(), address: randomUUID() },
                    publicService: PublicServiceCode.CreditHistory,
                },
            ]

            userSigningHistoryItemModelMock.find.mockReturnValueOnce(userSigningHistoryItemModelMock)
            userSigningHistoryItemModelMock.skip.mockReturnValueOnce(userSigningHistoryItemModelMock)
            userSigningHistoryItemModelMock.limit.mockReturnValueOnce(userSigningHistoryItemModelMock)
            userSigningHistoryItemModelMock.sort.mockReturnValueOnce(historyItems)
            userSigningHistoryItemModelMock.countDocuments.mockReturnValueOnce(historyItems.length)

            const result = await service.getSigningHistoryByActionV1(action, userIdentifier, skip, limit)

            expect(userSigningHistoryItemModelMock.find).toHaveBeenCalledWith({ userIdentifier, ...queryModifier })
            expect(userSigningHistoryItemModelMock.skip).toHaveBeenCalledWith(skip)
            expect(userSigningHistoryItemModelMock.limit).toHaveBeenCalledWith(limit)
            expect(userSigningHistoryItemModelMock.sort).toHaveBeenCalledWith({ _id: -1 })
            expect(userSigningHistoryItemModelMock.countDocuments).toHaveBeenCalledWith({ userIdentifier, ...queryModifier })
            expect(result).toEqual({
                total: historyItems.length,
                items: historyItems.map(({ resourceId, recipient, status }) => ({
                    statusName: expect.any(String),
                    date: expect.any(String),
                    id: resourceId,
                    recipient,
                    status,
                })),
            })
        })
    })

    describe(`method: ${service.getHistoryScreenCounts.name}`, () => {
        it('should return authorization and signing count by userIdentifier', async () => {
            const userIdentifier = randomUUID()
            const sessionId = randomUUID()
            const authCount = testKit.random.getRandomInt(0, 100)
            const signingCount = testKit.random.getRandomInt(0, 100)

            userSigningHistoryItemModelMock.countDocuments.mockResolvedValueOnce(authCount)
            userSigningHistoryItemModelMock.countDocuments.mockResolvedValueOnce(signingCount)

            const result = await service.getHistoryScreenCounts(userIdentifier, sessionId)

            expect(userSigningHistoryItemModelMock.countDocuments).toHaveBeenNthCalledWith(1, {
                userIdentifier,
                action: 'authDiiaId',
                sessionId,
            })
            expect(userSigningHistoryItemModelMock.countDocuments).toHaveBeenNthCalledWith(2, {
                userIdentifier,
                action: { $ne: 'authDiiaId' },
                sessionId,
            })
            expect(result).toEqual({ authorization: authCount, signing: signingCount })
        })
    })

    describe(`method ${service.getSigningHistoryItemByIdV1.name}`, () => {
        it.each([
            [
                UserHistoryCode.Authorization,
                (resourceId: string, userIdentifier: string): UserSigningHistoryItem => ({
                    userIdentifier,
                    sessionId: randomUUID(),
                    resourceId,
                    status: UserHistoryItemStatus.Done,
                    statusHistory: [{ status: UserHistoryItemStatus.Processing, date: new Date(Date.now() - DurationMs.Day) }],
                    documents: [randomUUID()],
                    date: new Date(),
                    recipient: { name: randomUUID(), address: randomUUID() },
                    publicService: PublicServiceCode.Debts,
                    platformType: PlatformType.Android,
                    platformVersion: '3.16.0',
                }),
                {
                    navigationPanel: {
                        header: 'Дія.Підпис',
                        contextMenu: [
                            {
                                type: PublicServiceContextMenuType.faqCategory,
                                code: 'diiaId',
                                name: 'Питання та відповіді',
                            },
                            {
                                type: PublicServiceContextMenuType.supportServiceScreen,
                                name: 'Служба підтримки',
                            },
                        ],
                    },
                    screen: {
                        title: 'Запит на авторизацію з Дія.Підпис',
                        status: UserHistoryItemStatus.Done,
                        statusMessage: {
                            title: 'Авторизовано',
                            text: expect.any(String),
                            icon: '✅',
                            parameters: [],
                        },
                        recipient: {
                            name: expect.any(String),
                            address: expect.any(String),
                        },
                        body: [
                            {
                                type: MessageBodyItemType.text,
                                data: {
                                    text: `Пристрій, з якого здійснено авторизацію: \n${PlatformType.Android} 3.16.0`,
                                    parameters: [],
                                },
                            },
                        ],
                    },
                },
            ],
            [
                UserHistoryCode.Signing,
                (resourceId: string, userIdentifier: string): UserSigningHistoryItem => ({
                    userIdentifier,
                    sessionId: randomUUID(),
                    resourceId,
                    status: UserHistoryItemStatus.Refuse,
                    statusHistory: [{ status: UserHistoryItemStatus.Processing, date: new Date(Date.now() - DurationMs.Day) }],
                    documents: ['document-1'],
                    date: new Date(),
                    recipient: { name: randomUUID(), address: randomUUID() },
                    publicService: PublicServiceCode.Debts,
                    platformType: PlatformType.iOS,
                    platformVersion: '4.17.0',
                }),
                {
                    navigationPanel: {
                        header: 'Дія.Підпис',
                        contextMenu: [
                            {
                                type: PublicServiceContextMenuType.faqCategory,
                                code: 'diiaId',
                                name: 'Питання та відповіді',
                            },
                            {
                                type: PublicServiceContextMenuType.supportServiceScreen,
                                name: 'Служба підтримки',
                            },
                        ],
                    },
                    screen: {
                        title: 'Запит на підписання цифрових документів',
                        status: UserHistoryItemStatus.Refuse,
                        statusMessage: {
                            title: 'Не підписано',
                            text: expect.any(String),
                            icon: '🚫',
                            parameters: [],
                        },
                        recipient: {
                            name: expect.any(String),
                            address: expect.any(String),
                        },
                        body: [
                            {
                                type: MessageBodyItemType.text,
                                data: {
                                    text: `Було підписано наступні документи:\n• document-1\n\nПристрій, з якого підписано: \n${PlatformType.iOS} 4.17.0`,
                                    parameters: [],
                                },
                            },
                        ],
                    },
                },
            ],
        ])('should return %s signing history item info', async (action, getSigningHistoryItem, expected) => {
            const resourceId = randomUUID()
            const userIdentifier = randomUUID()
            const signingHistoryItem = getSigningHistoryItem(resourceId, userIdentifier)

            userSigningHistoryItemModelMock.findOne.mockResolvedValueOnce(signingHistoryItem)

            const result = await service.getSigningHistoryItemByIdV1(resourceId, userIdentifier, action)

            expect(result).toEqual(expected)
        })

        it.each([
            [DiiaIdServiceCode.Authorization, 'authDiiaId'],
            [DiiaIdServiceCode.Signing, 'signingDiiaId'],
        ])(
            `should include ratingForm with serviceCode %s in response if status is ${UserHistoryItemStatus.Done} and is not publicService`,
            async (serviceCode, itemAction) => {
                const resourceId = randomUUID()
                const userIdentifier = randomUUID()
                const action = UserHistoryCode.Authorization
                const signingHistoryItem: UserSigningHistoryItem = {
                    userIdentifier,
                    sessionId: randomUUID(),
                    resourceId,
                    status: UserHistoryItemStatus.Done,
                    statusHistory: [{ status: UserHistoryItemStatus.Processing, date: new Date(Date.now() - DurationMs.Day) }],
                    documents: [randomUUID()],
                    date: new Date(),
                    recipient: { name: randomUUID(), address: randomUUID() },
                    platformType: PlatformType.Android,
                    platformVersion: '3.16.0',
                    action: itemAction,
                }
                const ratingForm = {
                    formCode: serviceCode,
                    resourceId,
                    title: randomUUID(),
                    rating: {
                        label: randomUUID(),
                        items: [],
                    },
                    comment: {
                        label: randomUUID(),
                        hint: randomUUID(),
                    },
                    mainButton: randomUUID(),
                }

                userSigningHistoryItemModelMock.findOne.mockResolvedValueOnce(signingHistoryItem)
                jest.spyOn(ratingSigningHistoryService, 'getRatingForm').mockResolvedValueOnce(ratingForm)

                const result = await service.getSigningHistoryItemByIdV1(resourceId, userIdentifier, action)

                expect(ratingSigningHistoryService.getRatingForm).toHaveBeenCalledWith(signingHistoryItem, userIdentifier)
                expect(result).toEqual({
                    navigationPanel: {
                        header: 'Дія.Підпис',
                        contextMenu: [
                            {
                                type: PublicServiceContextMenuType.faqCategory,
                                code: 'diiaId',
                                name: 'Питання та відповіді',
                            },
                            {
                                type: PublicServiceContextMenuType.supportServiceScreen,
                                name: 'Служба підтримки',
                            },
                        ],
                    },
                    screen: {
                        title: 'Запит на авторизацію з Дія.Підпис',
                        status: UserHistoryItemStatus.Done,
                        statusMessage: {
                            title: 'Авторизовано',
                            text: expect.any(String),
                            icon: '✅',
                            parameters: [],
                        },
                        recipient: {
                            name: expect.any(String),
                            address: expect.any(String),
                        },
                        body: [
                            {
                                type: MessageBodyItemType.text,
                                data: {
                                    text: `Пристрій, з якого здійснено авторизацію: \n${PlatformType.Android} 3.16.0`,
                                    parameters: [],
                                },
                            },
                        ],
                    },
                    ratingForm,
                })
            },
        )

        it('should throw error if signing history item was not found', async () => {
            const resourceId = randomUUID()
            const userIdentifier = randomUUID()
            const action = UserHistoryCode.Authorization

            userSigningHistoryItemModelMock.findOne.mockResolvedValueOnce(undefinedValue)

            await expect(service.getSigningHistoryItemByIdV1(resourceId, userIdentifier, action)).rejects.toThrow(
                new NotFoundError('Signing history item with provided resourceId not found for current user'),
            )
        })
    })

    describe(`method: ${service.countHistory.name}`, () => {
        it.each([
            ['userIdentifier is passed', randomUUID(), undefined],
            ['userIdentifier and sessionId are passed', randomUUID(), randomUUID()],
        ])('should return history items count when %s', async (_msg, userIdentifier, sessionId) => {
            const documentsCount = testKit.random.getRandomInt(0, 1000)

            userSigningHistoryItemModelMock.countDocuments.mockResolvedValueOnce(documentsCount)

            const result = await service.countHistory(userIdentifier, sessionId)

            expect(userSigningHistoryItemModelMock.countDocuments).toHaveBeenCalledWith({ userIdentifier, sessionId })
            expect(result).toBe(documentsCount)
        })
    })

    describe(`method: ${service.getItemStatuses.name}`, () => {
        it('should return history item status records', async () => {
            const resourceIdsCount = testKit.random.getRandomInt(1, 100)
            const resourceIds = Array.from({ length: resourceIdsCount }).map(() => randomUUID())
            const historyItems = resourceIds.map((resourceId) => ({
                status: UserHistoryItemStatus.Done,
                date: new Date(),
                resourceId,
            }))
            const expectedStatusRecords = historyItems.map(({ status, resourceId: sharingId, date }) => ({
                status,
                sharingId,
                date,
            }))

            userSigningHistoryItemModelMock.find.mockReturnValueOnce(userSigningHistoryItemModelMock)
            userSigningHistoryItemModelMock.sort.mockResolvedValueOnce(historyItems)

            const result = await service.getItemStatuses(resourceIds)

            expect(userSigningHistoryItemModelMock.find).toHaveBeenCalledWith({ resourceId: { $in: resourceIds } })
            expect(userSigningHistoryItemModelMock.sort).toHaveBeenCalledWith({ _id: -1 })
            expect(result).toEqual(expectedStatusRecords)
        })
    })

    describe(`method: ${service.getSigningHistoryByAction.name}`, () => {
        it.each([
            [
                'authorization',
                UserHistoryCode.Authorization,
                user.identifier,
                10,
                10,
                undefined,
                <HistoryResponseByCode>{
                    body: [
                        {
                            paginationListOrg: {
                                componentId: 'pagination_list_org',
                                items: [
                                    {
                                        cardMlc: {
                                            id: 'id',
                                            chipStatusAtm: {
                                                code: 'code',
                                                name: 'name',
                                                type: ChipStatusAtmType.success,
                                            },
                                            title: 'title',
                                            subtitles: [],
                                            description: 'description',
                                            botLabel: 'botLabel',
                                            btnPrimaryAdditionalAtm: {
                                                label: 'label',
                                                state: ButtonState.enabled,
                                                action: {
                                                    type: 'type',
                                                },
                                            },
                                        },
                                    },
                                ],
                                limit: 20,
                            },
                        },
                    ],
                    total: 1,
                },
                { action: 'authDiiaId' },
            ],
            [
                'signing',
                UserHistoryCode.Sharing,
                user.identifier,
                10,
                10,
                randomUUID(),
                <HistoryResponseByCode>{
                    body: [
                        {
                            paginationListOrg: {
                                componentId: 'pagination_list_org',
                                items: [
                                    {
                                        cardMlc: {
                                            id: 'id',
                                            chipStatusAtm: {
                                                code: 'code',
                                                name: 'name',
                                                type: ChipStatusAtmType.success,
                                            },
                                            title: 'title',
                                            subtitles: [],
                                            description: 'description',
                                            botLabel: 'botLabel',
                                            btnPrimaryAdditionalAtm: {
                                                label: 'label',
                                                state: ButtonState.enabled,
                                                action: {
                                                    type: 'type',
                                                },
                                            },
                                        },
                                    },
                                ],
                                limit: 20,
                            },
                        },
                    ],
                    total: 1,
                },
                { action: { $ne: 'authDiiaId' } },
            ],
        ])(
            'should return signing history by action when action is %s',
            async (_msg, action, userIdentifier, skip, limit, sessionId, expected, queryModifier) => {
                const items = [<UserSigningHistoryItemModel>{}]

                userSigningHistoryItemModelMock.find.mockReturnValueOnce(userSigningHistoryItemModelMock)
                userSigningHistoryItemModelMock.skip.mockReturnValueOnce(userSigningHistoryItemModelMock)
                userSigningHistoryItemModelMock.limit.mockReturnValueOnce(userSigningHistoryItemModelMock)
                userSigningHistoryItemModelMock.sort.mockReturnValueOnce(items)
                userSigningHistoryItemModelMock.countDocuments.mockReturnValueOnce(items.length)

                const cardMlc = {
                    id: 'id',
                    chipStatusAtm: {
                        code: 'code',
                        name: 'name',
                        type: ChipStatusAtmType.success,
                    },
                    title: 'title',
                    subtitles: [],
                    description: 'description',
                    botLabel: 'botLabel',
                    btnPrimaryAdditionalAtm: {
                        label: 'label',
                        state: ButtonState.enabled,
                        action: {
                            type: 'type',
                        },
                    },
                }

                jest.spyOn(userSigningHistoryDataMapper, 'toHistoryItemEntity').mockReturnValueOnce(cardMlc)

                const result = await service.getSigningHistoryByAction(action, userIdentifier, skip, limit, sessionId)

                expect(result).toEqual(expected)

                expect(userSigningHistoryItemModelMock.find).toHaveBeenCalledWith({ userIdentifier, sessionId, ...queryModifier })
                expect(userSigningHistoryItemModelMock.skip).toHaveBeenCalledWith(skip)
                expect(userSigningHistoryItemModelMock.limit).toHaveBeenCalledWith(limit)
                expect(userSigningHistoryItemModelMock.sort).toHaveBeenCalledWith({ _id: -1 })
                expect(userSigningHistoryItemModelMock.countDocuments).toHaveBeenCalledWith({ userIdentifier, sessionId, ...queryModifier })
            },
        )
    })

    describe(`method ${service.getSigningHistoryItemById.name}`, () => {
        it('should throw NotFoundError if signing history item not found for current user', async () => {
            userSigningHistoryItemModelMock.findOne.mockResolvedValueOnce(undefinedValue)

            const query = { resourceId: 'resourceId', sessionId: 'sessionId', userIdentifier: user.identifier }

            await expect(
                service.getSigningHistoryItemById('resourceId', user.identifier, UserHistoryCode.Authorization, undefined, 'sessionId'),
            ).rejects.toThrow(new NotFoundError('Signing history item with provided resourceId not found for current user'))
            expect(userSigningHistoryItemModelMock.findOne).toHaveBeenCalledWith(query)
        })

        it('should return signing history item by id', async () => {
            const query = { resourceId: 'resourceId', sessionId: 'sessionId', userIdentifier: user.identifier }

            const signingHistoryItem = <UserSigningHistoryItemModel>{
                userIdentifier: user.identifier,
                sessionId: randomUUID(),
                resourceId: 'resourceId',
                status: UserHistoryItemStatus.Done,
                statusHistory: [{ status: UserHistoryItemStatus.Processing, date: new Date(Date.now() - DurationMs.Day) }],
                documents: [randomUUID()],
                date: new Date(),
                recipient: { name: randomUUID(), address: randomUUID() },
                publicService: PublicServiceCode.Debts,
                platformType: PlatformType.Android,
                platformVersion: '3.16.0',
            }

            userSigningHistoryItemModelMock.findOne.mockResolvedValueOnce(signingHistoryItem)

            const navigationPanelMlc = {
                label: 'Історія підписань',
                ellipseMenu: [
                    {
                        type: PublicServiceContextMenuType.faqCategory,
                        name: 'Питання та відповіді',
                        code: 'diiaId',
                    },
                    {
                        type: PublicServiceContextMenuType.supportServiceScreen,
                        name: 'Служба підтримки',
                    },
                ],
            }

            const body = [
                {
                    titleLabelMlc: {
                        label: 'Запит на авторизацію з Дія.Підпис',
                    },
                },
                {
                    statusMessageMlc: {
                        icon: '✅',
                        title: 'Signed',
                        text: 'date',
                        parameters: [
                            {
                                type: ContentType.email,
                                data: {
                                    name: 'name',
                                    alt: 'alt',
                                    resource: 'resource',
                                },
                            },
                        ],
                    },
                },
                {
                    subtitleLabelMlc: {
                        label: 'label',
                    },
                },
                {
                    textLabelMlc: {
                        text: `Address. \n\nПристрій, з якого здійснено авторизацію: \n${signingHistoryItem.platformType} ${signingHistoryItem.platformVersion}`,
                        parameters: [],
                    },
                },
            ]

            const ratingForm = {
                title: 'string',
                rating: {
                    label: 'label',
                    items: [],
                },
                comment: {
                    label: 'label',
                    hint: 'hint',
                },
                mainButton: 'mainButton',
            }

            jest.spyOn(userHistoryDataMapper, 'getHistoryScreenNavigationPanelMlc').mockReturnValueOnce(navigationPanelMlc)
            jest.spyOn(userSigningHistoryDataMapper, 'getHistoryItem').mockReturnValueOnce(body)
            jest.spyOn(ratingSigningHistoryService, 'getRatingForm').mockResolvedValueOnce(ratingForm)

            const response = {
                topGroup: [
                    {
                        topGroupOrg: {
                            navigationPanelMlc,
                        },
                    },
                ],
                body,
                ratingForm,
            }

            expect(
                await service.getSigningHistoryItemById(
                    'resourceId',
                    user.identifier,
                    UserHistoryCode.Authorization,
                    undefined,
                    'sessionId',
                ),
            ).toMatchObject(response)
            expect(userSigningHistoryItemModelMock.findOne).toHaveBeenCalledWith(query)
            expect(userHistoryDataMapper.getHistoryScreenNavigationPanelMlc).toHaveBeenLastCalledWith(undefinedValue)
            expect(userSigningHistoryDataMapper.getHistoryItem).toHaveBeenCalledWith(signingHistoryItem, UserHistoryCode.Authorization, {
                platformType: PlatformType.Android,
                platformVersion: '3.16.0',
                documents: signingHistoryItem.documents,
            })
            expect(ratingSigningHistoryService.getRatingForm).toHaveBeenCalledWith(signingHistoryItem, user.identifier)
        })
    })
})
