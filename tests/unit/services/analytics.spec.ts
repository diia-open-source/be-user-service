import { randomUUID } from 'crypto'

import { MoleculerService } from '@diia-inhouse/diia-app'

import { AnalyticsActionResult, GetRatingFormParams, RateServiceEventPayload } from '@diia-inhouse/analytics'
import { EventBus, InternalEvent } from '@diia-inhouse/diia-queue'
import TestKit from '@diia-inhouse/test'
import { ActionVersion, Logger } from '@diia-inhouse/types'

import AnalyticsService from '@services/analytics'

import { AnalyticsActionType, AnalyticsCategory, GetLastSubmittedRatingParams } from '@interfaces/services/analytics'

describe('Service: `AnalyticsService`', () => {
    const eventBusMock = <EventBus>(<unknown>{
        publish: jest.fn(),
    })
    const loggerMock = <Logger>(<unknown>{
        info: jest.fn(),
        error: jest.fn(),
    })
    const moleculerMock = <MoleculerService>(<unknown>{
        act: jest.fn(),
        tryToAct: jest.fn(),
    })

    const analyticsService = new AnalyticsService(eventBusMock, loggerMock, moleculerMock)

    const analyticsCategory = AnalyticsCategory.Users
    const userIdentifier = randomUUID()
    const actionType = AnalyticsActionType.AddDocument
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const serviceName = 'Analytics'

    describe('method: `log`', () => {
        it('should store logs', () => {
            const infoSpy = jest.spyOn(loggerMock, 'info')

            analyticsService.log(analyticsCategory, userIdentifier, {}, actionType)

            expect(infoSpy).toHaveBeenCalledWith(expect.any(String), {
                analytics: expect.objectContaining({
                    data: {},
                    category: analyticsCategory,
                    action: {
                        type: actionType,
                        result: AnalyticsActionResult.Success,
                    },
                    identifier: userIdentifier,
                }),
            })
        })

        it('should store logs with headers', () => {
            const infoSpy = jest.spyOn(loggerMock, 'info')

            analyticsService.log(analyticsCategory, userIdentifier, {}, actionType, headers)

            expect(infoSpy).toHaveBeenCalledWith(expect.any(String), {
                analytics: expect.objectContaining({
                    device: {
                        identifier: headers.mobileUid,
                        platform: {
                            type: headers.platformType,
                            version: headers.platformVersion,
                        },
                    },
                    appVersion: headers.appVersion,
                }),
            })
        })
    })

    describe('method: `getLastSubmittedRating`', () => {
        it('should call molecularService act method', async () => {
            const actSpy = jest.spyOn(moleculerMock, 'act')

            await analyticsService.getLastSubmittedRating(<GetLastSubmittedRatingParams>{})

            expect(actSpy).toHaveBeenCalledWith(
                serviceName,
                {
                    name: analyticsService.getLastSubmittedRating.name,
                    actionVersion: ActionVersion.V1,
                },
                {
                    params: {},
                },
            )
        })
    })

    describe('method: `getRatingForm`', () => {
        it.each([
            ['response with object', {}],
            ['response without object', undefined],
        ])('should call molecularService tryToAct method %s', async (_message, ratingForm) => {
            const tryToActSpy = jest.spyOn(moleculerMock, 'tryToAct').mockResolvedValueOnce({ ratingForm })

            await expect(analyticsService.getRatingForm(<GetRatingFormParams>{})).resolves.toEqual({ ratingForm })

            expect(tryToActSpy).toHaveBeenCalledWith(
                serviceName,
                {
                    name: analyticsService.getRatingForm.name,
                    actionVersion: ActionVersion.V2,
                },
                {
                    params: {},
                },
            )
        })
    })

    describe('method: `notifyRate`', () => {
        it('should call publish method', async () => {
            const publishSpy = jest.spyOn(eventBusMock, 'publish')
            const payload = <RateServiceEventPayload>{}

            await analyticsService.notifyRate(payload)

            expect(publishSpy).toHaveBeenCalledWith(InternalEvent.RateService, payload)
        })

        it('should log throwed error', async () => {
            const throwedError = new Error()

            jest.spyOn(eventBusMock, 'publish').mockRejectedValueOnce(throwedError)
            const errorSpy = jest.spyOn(loggerMock, 'error')
            const payload = <RateServiceEventPayload>{}

            await analyticsService.notifyRate(payload)

            expect(errorSpy).toHaveBeenCalledWith(expect.any(String), {
                err: throwedError,
            })
        })
    })
})
