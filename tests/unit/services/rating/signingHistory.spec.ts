import { randomUUID } from 'node:crypto'

import { DateTime } from 'luxon'

import { DiiaIdServiceCode, RatingCategory } from '@diia-inhouse/analytics'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { MessageActionSubtype, PlatformType, TemplateStub } from '@diia-inhouse/types'

import AnalyticsService from '@services/analytics'
import RatingSigningHistoryService from '@services/rating/signingHistory'

import { UserSigningHistoryItemModel } from '@interfaces/models/userSigningHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Service RatingSigningHistoryService`, () => {
    const testKit = new TestKit()
    const analyticsService = mockInstance(AnalyticsService)

    const service = new RatingSigningHistoryService(analyticsService)
    const session = testKit.session.getUserSession()
    const headers = testKit.session.getHeaders()
    const daysAfterLastRatingSubmitThreshold = 30

    describe('method: `sendRatingPush`', () => {
        it('should return undefined if rating is not available', async () => {
            const model = <UserSigningHistoryItemModel>{
                status: UserHistoryItemStatus.Processing,
                publicService: undefined,
            }

            expect(await service.sendRatingPush(model, session.user.identifier)).toBeUndefined()
        })

        it('should return undefined if rated days count less than last submit threshold', async () => {
            const ratedAt = DateTime.now().toString()

            const model = <UserSigningHistoryItemModel>{
                status: UserHistoryItemStatus.Done,
                publicService: undefined,
                action: 'authDiiaId',
                resourceId: randomUUID(),
            }

            const lastSubmittedRating = {
                userIdentifier: session.user.identifier,
                mobileUid: headers.mobileUid,
                isClosed: false,
                ratedAt,
                category: RatingCategory.DiiaId,
                serviceCode: DiiaIdServiceCode.Signing,
            }

            jest.spyOn(analyticsService, 'getLastSubmittedRating').mockResolvedValueOnce(lastSubmittedRating)
            jest.spyOn(analyticsService, 'notifyRate').mockResolvedValueOnce()

            expect(await service.sendRatingPush(model, session.user.identifier)).toBeUndefined()
            expect(analyticsService.getLastSubmittedRating).toHaveBeenCalledWith({
                userIdentifier: session.user.identifier,
                category: RatingCategory.DiiaId,
                serviceCode: DiiaIdServiceCode.Authorization,
            })
        })

        it('should successfully send rating push', async () => {
            const ratedAt = DateTime.now()
                .set({ day: DateTime.now().day - daysAfterLastRatingSubmitThreshold - 1 })
                .toString()

            const model = <UserSigningHistoryItemModel>{
                status: UserHistoryItemStatus.Done,
                publicService: undefined,
                action: 'authDiiaId',
                resourceId: randomUUID(),
            }

            const lastSubmittedRating = {
                userIdentifier: session.user.identifier,
                mobileUid: headers.mobileUid,
                isClosed: false,
                ratedAt,
                category: RatingCategory.DiiaId,
                serviceCode: DiiaIdServiceCode.Signing,
            }

            jest.spyOn(analyticsService, 'getLastSubmittedRating').mockResolvedValueOnce(lastSubmittedRating)
            jest.spyOn(analyticsService, 'notifyRate').mockResolvedValueOnce()

            expect(await service.sendRatingPush(model, session.user.identifier)).toBeUndefined()
            expect(analyticsService.getLastSubmittedRating).toHaveBeenCalledWith({
                userIdentifier: session.user.identifier,
                category: RatingCategory.DiiaId,
                serviceCode: DiiaIdServiceCode.Authorization,
            })
            expect(analyticsService.notifyRate).toHaveBeenCalledWith({
                userIdentifier: session.user.identifier,
                category: RatingCategory.DiiaId,
                serviceCode: DiiaIdServiceCode.Authorization,
                resourceId: model.resourceId,
                notificationParams: {
                    templateParams: { [TemplateStub.ShortText]: 'Поділіться враженнями та досвідом використання Дія.Підпису.' },
                    action: {
                        type: 'diiaId',
                        subtype: MessageActionSubtype.authorization,
                    },
                    appVersions: {
                        [PlatformType.iOS]: { minVersion: '3.0.65.1285' },
                        [PlatformType.Android]: { minVersion: '3.0.74.1234' },
                        [PlatformType.Huawei]: { minVersion: '3.0.74.1234' },
                    },
                },
            })
        })
    })

    describe('method: `getRatingForm`', () => {
        it('should return undefined if rating is not available', async () => {
            const model = <UserSigningHistoryItemModel>{
                status: UserHistoryItemStatus.Processing,
                publicService: undefined,
            }

            expect(await service.getRatingForm(model, session.user.identifier)).toBeUndefined()
        })

        it('should return undefined if rating form is absent', async () => {
            const model = <UserSigningHistoryItemModel>{
                status: UserHistoryItemStatus.Done,
                action: 'authDiiaId',
                publicService: undefined,
                statusHistory: [{ status: UserHistoryItemStatus.Done, date: new Date() }],
                resourceId: randomUUID(),
            }
            const undefinedValue = undefined

            jest.spyOn(analyticsService, 'getRatingForm').mockResolvedValueOnce(undefinedValue)

            expect(await service.getRatingForm(model, session.user.identifier)).toBeUndefined()
            expect(analyticsService.getRatingForm).toHaveBeenCalledWith({
                userIdentifier: session.user.identifier,
                category: RatingCategory.DiiaId,
                serviceCode: DiiaIdServiceCode.Authorization,
                statusDate: model.statusHistory[0].date,
                resourceId: model.resourceId,
                hasRatingSubmitThreshold: true,
                daysAfterLastRatingSubmitThreshold,
            })
        })

        it('should return rating form with authDiiaId action', async () => {
            const model = <UserSigningHistoryItemModel>{
                status: UserHistoryItemStatus.Done,
                action: 'authDiiaId',
                publicService: undefined,
                statusHistory: [{ status: UserHistoryItemStatus.Done, date: new Date() }],
                resourceId: randomUUID(),
            }

            const ratingFormResponse = {
                ratingStartsAtUnixTime: 100,
                ratingForm: {
                    formCode: DiiaIdServiceCode.Authorization,
                    title: 'title',
                    rating: {
                        label: 'label',
                        items: [],
                    },
                    comment: {
                        label: 'label',
                        hint: 'hint',
                    },
                    mainButton: 'mainButton',
                },
            }

            jest.spyOn(analyticsService, 'getRatingForm').mockResolvedValueOnce(ratingFormResponse)

            expect(await service.getRatingForm(model, session.user.identifier)).toMatchObject(ratingFormResponse.ratingForm)
            expect(analyticsService.getRatingForm).toHaveBeenCalledWith({
                userIdentifier: session.user.identifier,
                category: RatingCategory.DiiaId,
                serviceCode: DiiaIdServiceCode.Authorization,
                statusDate: model.statusHistory[0].date,
                resourceId: model.resourceId,
                hasRatingSubmitThreshold: true,
                daysAfterLastRatingSubmitThreshold,
            })
        })

        it('should return rating form', async () => {
            const model = <UserSigningHistoryItemModel>{
                status: UserHistoryItemStatus.Done,
                action: 'action',
                publicService: undefined,
                statusHistory: [{ status: UserHistoryItemStatus.Done, date: new Date() }],
                resourceId: randomUUID(),
            }

            const ratingFormResponse = {
                ratingStartsAtUnixTime: 100,
                ratingForm: {
                    formCode: DiiaIdServiceCode.Signing,
                    title: 'title',
                    rating: {
                        label: 'label',
                        items: [],
                    },
                    comment: {
                        label: 'label',
                        hint: 'hint',
                    },
                    mainButton: 'mainButton',
                },
            }

            jest.spyOn(analyticsService, 'getRatingForm').mockResolvedValueOnce(ratingFormResponse)

            expect(await service.getRatingForm(model, session.user.identifier)).toMatchObject(ratingFormResponse.ratingForm)
            expect(analyticsService.getRatingForm).toHaveBeenCalledWith({
                userIdentifier: session.user.identifier,
                category: RatingCategory.DiiaId,
                serviceCode: DiiaIdServiceCode.Signing,
                statusDate: model.statusHistory[0].date,
                resourceId: model.resourceId,
                hasRatingSubmitThreshold: true,
                daysAfterLastRatingSubmitThreshold,
            })
        })
    })
})
