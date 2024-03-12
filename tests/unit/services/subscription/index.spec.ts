const creditHistoryStrategyServiceStubs = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    getModifier: jest.fn(),
    publishSubscription: jest.fn(),
}
const publicServiceStrategyServiceStubs = {
    subscribe: jest.fn(),
}

class CreditHistoryStrategyServiceMock {
    subscribe(...args: unknown[]): unknown {
        return creditHistoryStrategyServiceStubs.subscribe(...args)
    }

    unsubscribe(...args: unknown[]): unknown {
        return creditHistoryStrategyServiceStubs.unsubscribe(...args)
    }

    getModifier(...args: unknown[]): unknown {
        return creditHistoryStrategyServiceStubs.getModifier(...args)
    }

    publishSubscription(...args: unknown[]): unknown {
        return creditHistoryStrategyServiceStubs.publishSubscription(...args)
    }
}

class PublicServiceStrategyServiceMock {
    subscribe(...args: unknown[]): unknown {
        return publicServiceStrategyServiceStubs.subscribe(...args)
    }
}

jest.mock('@services/subscription/strategies/creditHistory', () => CreditHistoryStrategyServiceMock)
jest.mock('@services/subscription/strategies/publicService', () => PublicServiceStrategyServiceMock)

import { randomUUID } from 'crypto'

import { UpdateWriteOpResult } from 'mongoose'

import { IdentifierService } from '@diia-inhouse/crypto'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { BadRequestError, ModelNotFoundError, NotFoundError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import SubscriptionService from '@src/services/subscription'

import AnalyticsService from '@services/analytics'
import UserDocumentService from '@services/userDocument'

import UbchProvider from '@providers/creditHistory/ubch'

import subscriptionModel from '@models/subscription'

import SubscriptionDataMapper from '@dataMappers/subscriptionDataMapper'

import { AppConfig } from '@interfaces/config'
import { PublicServiceCode, SubscriptionSubType, SubscriptionType } from '@interfaces/models/subscription'
import { AnalyticsActionType, AnalyticsCategory } from '@interfaces/services/analytics'
import { SubscriptionCode } from '@interfaces/services/subscription'

describe('SubscriptionService', () => {
    const testKit = new TestKit()
    const config = {
        subscription: {
            debtsSalt: 'debts-salt',
        },
    }
    const analyticsServiceMock = mockInstance(AnalyticsService)
    const userDocumentServiceMock = mockInstance(UserDocumentService)
    const subscriptionDataMapperMock = mockInstance(SubscriptionDataMapper)
    const creditHistoryProviderMock = mockInstance(UbchProvider)
    const identifierServiceMock = mockInstance(IdentifierService)
    const loggerMock = mockInstance(DiiaLogger)
    const subscriptionService = new SubscriptionService(
        analyticsServiceMock,
        userDocumentServiceMock,
        subscriptionDataMapperMock,
        creditHistoryProviderMock,
        <AppConfig>config,
        identifierServiceMock,
        loggerMock,
    )

    describe('method: `getSubscriptions`', () => {
        it('should successfully fetch and return existing subscriptions', async () => {
            const {
                user: { identifier: userIdentifier, itn },
            } = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const validSubscriptionModel = new subscriptionModel({
                push: {},
                subscriptionIds: [],
                userIdentifier,
                segment: {},
            })
            const expectedResult = {
                description: 'description',
                subscriptions: [],
            }

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(validSubscriptionModel)
            jest.spyOn(subscriptionDataMapperMock, 'toSubscriptionsResponse').mockReturnValueOnce(expectedResult)

            expect(await subscriptionService.getSubscriptions(userIdentifier, itn, headers)).toEqual(expectedResult)

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(subscriptionDataMapperMock.toSubscriptionsResponse).toHaveBeenCalledWith(validSubscriptionModel, headers)
        })

        it('should successfully create initial subscription in case it does not exist', async () => {
            const debtsIdentifier = randomUUID()
            const {
                user: { identifier: userIdentifier, itn },
            } = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const subscriptionData = {
                userIdentifier,
                subscriptionIds: {},
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.Documents]: {},
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.Debts]: {
                            [debtsIdentifier]: true,
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
            const validSubscriptionModel = new subscriptionModel(subscriptionData)
            const expectedResult = {
                description: 'description',
                subscriptions: [],
            }

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(debtsIdentifier)
            jest.spyOn(subscriptionModel, 'create').mockResolvedValueOnce(<[]>(<unknown>validSubscriptionModel))
            jest.spyOn(subscriptionDataMapperMock, 'toSubscriptionsResponse').mockReturnValueOnce(expectedResult)

            expect(await subscriptionService.getSubscriptions(userIdentifier, itn, headers)).toEqual(expectedResult)

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(itn, { customSalt: config.subscription.debtsSalt })
            expect(subscriptionModel.create).toHaveBeenCalledWith(subscriptionData)
            expect(subscriptionDataMapperMock.toSubscriptionsResponse).toHaveBeenCalledWith(validSubscriptionModel, headers)
        })
    })

    describe('method: `subscribe`', () => {
        it('should successfully subscribe', async () => {
            const {
                user: { itn, identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const params = {
                code: SubscriptionCode.CreditHistory,
                itn,
                userIdentifier,
            }
            const validSubscriptionModel = new subscriptionModel({
                push: {},
                subscriptionIds: [],
                userIdentifier,
                segment: {},
            })
            const modifier = {
                [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.creditHistory.${randomUUID()}`]: true,
                ['subscriptionIds.ubch']: randomUUID(),
            }

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(validSubscriptionModel)
            creditHistoryStrategyServiceStubs.subscribe.mockResolvedValueOnce(modifier)
            jest.spyOn(subscriptionModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{})

            expect(await subscriptionService.subscribe(params)).toBeUndefined()

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(creditHistoryStrategyServiceStubs.subscribe).toHaveBeenCalledWith(validSubscriptionModel, params)
            expect(subscriptionModel.updateOne).toHaveBeenCalledWith({ userIdentifier }, modifier)
        })

        it('should just do nothing in case modifier is empty', async () => {
            const code = SubscriptionCode.CreditHistory
            const {
                user: { itn, identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const params = {
                code,
                itn,
                userIdentifier,
            }
            const validSubscriptionModel = new subscriptionModel({
                push: {},
                subscriptionIds: [],
                userIdentifier,
                segment: {},
            })

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(validSubscriptionModel)
            creditHistoryStrategyServiceStubs.subscribe.mockResolvedValueOnce(undefined)

            expect(await subscriptionService.subscribe(params)).toBeUndefined()

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(creditHistoryStrategyServiceStubs.subscribe).toHaveBeenCalledWith(validSubscriptionModel, params)
            expect(loggerMock.warn).toHaveBeenCalledWith('Subscription modifier is empty', { code })
        })

        it('should fail with error in case strategy is not defined for provided code', async () => {
            const code = SubscriptionCode.Debts
            const {
                user: { itn, identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const params = {
                code,
                itn,
                userIdentifier,
            }
            const validSubscriptionModel = new subscriptionModel({
                push: {},
                subscriptionIds: [],
                userIdentifier,
                segment: {},
            })

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(validSubscriptionModel)

            await expect(async () => {
                await subscriptionService.subscribe(params)
            }).rejects.toEqual(new BadRequestError(`Provided code is not supported yet: ${code}`))

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
        })

        it('should fail with error in case subscription is not found', async () => {
            const {
                user: { itn, identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const params = {
                code: SubscriptionCode.CreditHistory,
                itn,
                userIdentifier,
            }

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(null)

            await expect(async () => {
                await subscriptionService.subscribe(params)
            }).rejects.toEqual(new ModelNotFoundError(subscriptionModel.modelName, ''))

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
        })
    })

    describe('method: `unsubscribe`', () => {
        it('should successfully unsubscribe', async () => {
            const {
                user: { itn, identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const params = {
                code: SubscriptionCode.CreditHistory,
                itn,
                userIdentifier,
            }
            const validSubscriptionModel = new subscriptionModel({
                push: {},
                subscriptionIds: [],
                userIdentifier,
                segment: {},
            })
            const modifier = {
                [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.creditHistory.${randomUUID()}`]: true,
                ['subscriptionIds.ubch']: randomUUID(),
            }

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(validSubscriptionModel)
            creditHistoryStrategyServiceStubs.unsubscribe.mockResolvedValueOnce(modifier)
            jest.spyOn(subscriptionModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{})

            expect(await subscriptionService.unsubscribe(params)).toBeUndefined()

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(creditHistoryStrategyServiceStubs.unsubscribe).toHaveBeenCalledWith(validSubscriptionModel, params)
            expect(subscriptionModel.updateOne).toHaveBeenCalledWith({ userIdentifier }, modifier)
        })

        it('should just do nothing in case modifier is empty', async () => {
            const code = SubscriptionCode.CreditHistory
            const {
                user: { itn, identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const params = {
                code,
                itn,
                userIdentifier,
            }
            const validSubscriptionModel = new subscriptionModel({
                push: {},
                subscriptionIds: [],
                userIdentifier,
                segment: {},
            })

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(validSubscriptionModel)
            creditHistoryStrategyServiceStubs.unsubscribe.mockResolvedValueOnce(undefined)

            expect(await subscriptionService.unsubscribe(params)).toBeUndefined()

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(creditHistoryStrategyServiceStubs.unsubscribe).toHaveBeenCalledWith(validSubscriptionModel, params)
            expect(loggerMock.warn).toHaveBeenCalledWith('Unsubscription modifier is empty', { code })
        })

        it('should fail with error in case strategy is not defined for provided code', async () => {
            const code = SubscriptionCode.PublicService
            const {
                user: { itn, identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const params = {
                code,
                itn,
                userIdentifier,
            }
            const validSubscriptionModel = new subscriptionModel({
                push: {},
                subscriptionIds: [],
                userIdentifier,
                segment: {},
            })

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(validSubscriptionModel)

            await expect(async () => {
                await subscriptionService.unsubscribe(params)
            }).rejects.toEqual(new BadRequestError(`Provided code is not supported yet: ${code}`))

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
        })
    })

    describe('method: `getSubscribedSegments`', () => {
        const debtsIdentifier = randomUUID()
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()

        it.each([
            [
                'should successfully fetch and return subscribed segments',
                {
                    userIdentifier,
                    subscriptionIds: {},
                    [SubscriptionType.Push]: {
                        [SubscriptionSubType.Documents]: {},
                        [SubscriptionSubType.PublicServices]: {
                            [PublicServiceCode.Debts]: {
                                [debtsIdentifier]: true,
                            },
                            [PublicServiceCode.CreditHistory]: {
                                [userIdentifier]: false,
                            },
                        },
                    },
                    [SubscriptionType.Segment]: {
                        [SubscriptionSubType.PublicServices]: [],
                    },
                },
            ],
            [
                'should successfully return empty list in case no segments in subscription model',
                {
                    userIdentifier,
                    subscriptionIds: {},
                    [SubscriptionType.Push]: {
                        [SubscriptionSubType.Documents]: {},
                        [SubscriptionSubType.PublicServices]: {
                            [PublicServiceCode.Debts]: {
                                [debtsIdentifier]: true,
                            },
                            [PublicServiceCode.CreditHistory]: {
                                [userIdentifier]: false,
                            },
                        },
                    },
                },
            ],
        ])('%s', async (_msg, subscriptionData) => {
            const validSubscriptionModel = new subscriptionModel(subscriptionData)

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(validSubscriptionModel)

            expect(await subscriptionService.getSubscribedSegments(userIdentifier)).toEqual([])

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
        })
    })

    describe('method: `setDocumentsSubscription`', () => {
        const subscriptionType = SubscriptionType.Segment
        const documentType = DocumentType.BirthCertificate
        const documentIdentifier = randomUUID()
        const documentSubscriptionId = randomUUID()
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()
        const headers = testKit.session.getHeaders()

        it.each([
            ['add documents subscription', true, AnalyticsActionType.AddDocumentSubscription],
            ['remove documents subscription', false, AnalyticsActionType.RemoveDocumentSubscription],
        ])('should successfully %s', async (_msg, isSubscribed, actionType) => {
            const modifier = {
                [`${subscriptionType}.${SubscriptionSubType.Documents}.${documentType}.${documentIdentifier}`]: isSubscribed,
            }

            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(documentIdentifier)
            jest.spyOn(userDocumentServiceMock, 'validateUserDocument').mockResolvedValueOnce(true)
            jest.spyOn(subscriptionModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{})

            expect(
                await subscriptionService.setDocumentsSubscription({
                    userIdentifier,
                    subscriptionType,
                    documentType,
                    documentSubscriptionId,
                    isSubscribed,
                    headers,
                }),
            ).toBeUndefined()

            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(documentSubscriptionId)
            expect(userDocumentServiceMock.validateUserDocument).toHaveBeenCalledWith(userIdentifier, documentType, documentIdentifier)
            expect(subscriptionModel.updateOne).toHaveBeenCalledWith({ userIdentifier }, modifier, { upsert: true })
            expect(analyticsServiceMock.log).toHaveBeenCalledWith(
                AnalyticsCategory.Users,
                userIdentifier,
                { subscriptionType, documentType, documentId: documentIdentifier },
                actionType,
                headers,
            )
        })

        it('should fail with error in case document is invalid', async () => {
            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(documentIdentifier)
            jest.spyOn(userDocumentServiceMock, 'validateUserDocument').mockResolvedValueOnce(false)

            await expect(async () => {
                await subscriptionService.setDocumentsSubscription({
                    userIdentifier,
                    subscriptionType,
                    documentType,
                    documentSubscriptionId,
                    isSubscribed: true,
                    headers,
                })
            }).rejects.toEqual(new NotFoundError('User has not this document'))

            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(documentSubscriptionId)
            expect(userDocumentServiceMock.validateUserDocument).toHaveBeenCalledWith(userIdentifier, documentType, documentIdentifier)
        })
    })

    describe('method: `setPublicServiceSubscriptions`', () => {
        it('should publish existing public service subscription', async () => {
            const {
                user: { identifier: userIdentifier, itn },
            } = testKit.session.getUserSession()
            const validSubscriptionModel = new subscriptionModel({
                push: {},
                subscriptionIds: [],
                userIdentifier,
                segment: {},
            })

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(validSubscriptionModel)
            creditHistoryStrategyServiceStubs.publishSubscription.mockResolvedValueOnce(undefined)

            expect(await subscriptionService.setPublicServiceSubscriptions(userIdentifier, itn)).toBeUndefined()

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(creditHistoryStrategyServiceStubs.publishSubscription).toHaveBeenCalledWith(validSubscriptionModel, {
                userIdentifier,
                itn,
                code: SubscriptionCode.CreditHistory,
                autoSubscribe: true,
            })
        })

        it('should create public service subscription first then publish', async () => {
            const debtsIdentifier = randomUUID()
            const {
                user: { identifier: userIdentifier, itn },
            } = testKit.session.getUserSession()
            const subscriptionData = {
                userIdentifier,
                subscriptionIds: {},
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.Documents]: {},
                    [SubscriptionSubType.PublicServices]: {
                        [PublicServiceCode.Debts]: {
                            [debtsIdentifier]: true,
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
            const validSubscriptionModel = new subscriptionModel(subscriptionData)

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(debtsIdentifier)
            jest.spyOn(subscriptionModel, 'create').mockResolvedValueOnce(<[]>(<unknown>validSubscriptionModel))
            creditHistoryStrategyServiceStubs.publishSubscription.mockResolvedValueOnce(undefined)

            expect(await subscriptionService.setPublicServiceSubscriptions(userIdentifier, itn)).toBeUndefined()

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(itn, { customSalt: config.subscription.debtsSalt })
            expect(subscriptionModel.create).toHaveBeenCalledWith(subscriptionData)
            expect(creditHistoryStrategyServiceStubs.publishSubscription).toHaveBeenCalledWith(validSubscriptionModel, {
                userIdentifier,
                itn,
                code: SubscriptionCode.CreditHistory,
                autoSubscribe: true,
            })
        })
    })

    describe('method: `updateDocumentsSubscriptions`', () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()
        const birthCertificateIdentifier = randomUUID()
        const headers = testKit.session.getHeaders()

        it.each([
            [
                'should successfully update documents subscriptions',
                new subscriptionModel({
                    userIdentifier,
                    [SubscriptionType.Push]: {
                        [SubscriptionSubType.Documents]: {
                            [DocumentType.BirthCertificate]: {
                                [birthCertificateIdentifier]: true,
                            },
                        },
                    },
                }),
                (): void => {
                    jest.spyOn(subscriptionModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{})
                },
                (): void => {
                    expect(analyticsServiceMock.log).toHaveBeenCalledWith(
                        AnalyticsCategory.Users,
                        userIdentifier,
                        {
                            subscriptionType: SubscriptionType.Push,
                            documentType: DocumentType.BirthCertificate,
                            documentId: birthCertificateIdentifier,
                        },
                        AnalyticsActionType.RemoveDocumentSubscription,
                        headers,
                    )
                    expect(subscriptionModel.updateOne).toHaveBeenCalledWith(
                        { userIdentifier },
                        {
                            $unset: {
                                [`${SubscriptionType.Push}.${SubscriptionSubType.Documents}.${DocumentType.BirthCertificate}.${birthCertificateIdentifier}`]: 1,
                            },
                        },
                    )
                },
            ],
            ['should skip update in case subscription is not found', null, (): void => {}, (): void => {}],
            [
                'should not update documents subscriptions in case there is no such document type in subscription',
                new subscriptionModel({
                    userIdentifier,
                    [SubscriptionType.Push]: {
                        [SubscriptionSubType.Documents]: {},
                    },
                }),
                (): void => {},
                (): void => {},
            ],
        ])('%s', async (_msg, subscription, defineSpies, checkExpectations) => {
            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(subscription)
            defineSpies()

            expect(
                await subscriptionService.updateDocumentsSubscriptions(userIdentifier, DocumentType.BirthCertificate, [], headers),
            ).toBeUndefined()

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            checkExpectations()
        })
    })

    describe('method: `getSubscribedUserIdentifier`', () => {
        it('should successfully return user identifier', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const subscriptionType = SubscriptionType.Push
            const publicServiceCode = PublicServiceCode.CreditHistory
            const subscriptionKey = randomUUID()

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce({ userIdentifier })

            expect(await subscriptionService.getSubscribedUserIdentifier(subscriptionType, publicServiceCode, subscriptionKey)).toEqual(
                userIdentifier,
            )

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({
                [`${subscriptionType}.${SubscriptionSubType.PublicServices}.${publicServiceCode}.${subscriptionKey}`]: true,
            })
        })

        it('should just log when subscription not found', async () => {
            const subscriptionType = SubscriptionType.Push
            const publicServiceCode = PublicServiceCode.CreditHistory
            const subscriptionKey = randomUUID()

            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(null)

            expect(
                await subscriptionService.getSubscribedUserIdentifier(subscriptionType, publicServiceCode, subscriptionKey),
            ).toBeUndefined()

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({
                [`${subscriptionType}.${SubscriptionSubType.PublicServices}.${publicServiceCode}.${subscriptionKey}`]: true,
            })
            expect(loggerMock.info).toHaveBeenCalledWith('No subscribed users', { subscriptionType, publicServiceCode, subscriptionKey })
        })
    })

    describe('method: `isSubscribed`', () => {
        it.each([
            [true, 1],
            [false, 0],
            [true, 2],
        ])('should return %s', async (expectedResult, count) => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const publicServiceCode = PublicServiceCode.CreditHistory
            const subscriptionKey = userIdentifier

            jest.spyOn(subscriptionModel, 'countDocuments').mockResolvedValueOnce(count)

            expect(await subscriptionService.isSubscribed(userIdentifier, publicServiceCode)).toEqual(expectedResult)

            expect(subscriptionModel.countDocuments).toHaveBeenCalledWith({
                userIdentifier,
                [`${SubscriptionType.Push}.${SubscriptionSubType.PublicServices}.${publicServiceCode}.${subscriptionKey}`]: true,
            })
        })
    })

    describe('method: `getSubscribedDocuments`', () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()
        const birthCertificateIdentifier = randomUUID()

        it.each([
            [
                'should successfully return list of documents identifiers',
                {
                    userIdentifier,
                    [SubscriptionType.Push]: {
                        [SubscriptionSubType.Documents]: {
                            [DocumentType.BirthCertificate]: {
                                [birthCertificateIdentifier]: true,
                            },
                        },
                    },
                },
                [birthCertificateIdentifier],
            ],
            ['should return undefined', null, undefined],
            [
                'should return empty list',
                {
                    userIdentifier,
                    [SubscriptionType.Push]: {
                        [SubscriptionSubType.Documents]: {},
                    },
                },
                [],
            ],
        ])('%s', async (_msg, inputSubscription, expectedResult) => {
            jest.spyOn(subscriptionModel, 'findOne').mockResolvedValueOnce(inputSubscription)

            expect(
                await subscriptionService.getSubscribedDocuments(userIdentifier, SubscriptionType.Push, DocumentType.BirthCertificate),
            ).toEqual(expectedResult)

            expect(subscriptionModel.findOne).toHaveBeenCalledWith({ userIdentifier })
        })
    })

    describe('method: `updateByUserIdentifier`', () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()

        it('should successfully update user identifier', async () => {
            const query = { userIdentifier }
            const modifier = {
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.Documents]: {
                        [DocumentType.BirthCertificate]: {
                            [randomUUID()]: true,
                        },
                    },
                },
            }

            jest.spyOn(subscriptionModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{ modifiedCount: 1 })

            expect(await subscriptionService.updateByUserIdentifier(userIdentifier, modifier)).toBeUndefined()

            expect(subscriptionModel.updateOne).toHaveBeenCalledWith(query, modifier)
        })

        it('should fail with error in case modified count of documents is 0', async () => {
            const query = { userIdentifier }
            const modifier = {
                [SubscriptionType.Push]: {
                    [SubscriptionSubType.Documents]: {
                        [DocumentType.BirthCertificate]: {
                            [randomUUID()]: true,
                        },
                    },
                },
            }

            jest.spyOn(subscriptionModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{ modifiedCount: 0 })

            await expect(async () => {
                await subscriptionService.updateByUserIdentifier(userIdentifier, modifier)
            }).rejects.toEqual(new ModelNotFoundError(subscriptionModel.collection.name, userIdentifier))

            expect(subscriptionModel.updateOne).toHaveBeenCalledWith(query, modifier)
        })
    })
})
