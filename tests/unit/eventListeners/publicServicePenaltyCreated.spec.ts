import { randomUUID } from 'node:crypto'

import DiiaLogger from '@diia-inhouse/diia-logger'
import { EventBus } from '@diia-inhouse/diia-queue'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import PublicServicePenaltyCreatedEventListener from '@src/eventListeners/publicServicePenaltyCreated'

import AnalyticsService from '@services/analytics'
import UserDocumentService from '@services/userDocument'

import { EventPayload } from '@interfaces/eventListeners/publicServicePenaltyCreated'
import { InternalEvent } from '@interfaces/queue'
import { AnalyticsActionType, AnalyticsCategory } from '@interfaces/services/analytics'

describe('PublicServicePenaltyCreatedEventListener', () => {
    const testKit = new TestKit()
    const analyticsServiceMock = mockInstance(AnalyticsService)
    const userDocumentServiceMock = mockInstance(UserDocumentService)
    const eventBusMock = mockInstance(EventBus)
    const loggerMock = mockInstance(DiiaLogger)
    const publicServicePenaltyCreatedEventListener = new PublicServicePenaltyCreatedEventListener(
        analyticsServiceMock,
        userDocumentServiceMock,
        eventBusMock,
        loggerMock,
    )

    describe('method: `handler`', () => {
        const {
            user: { identifier = 'user-identifier' },
        } = testKit.session.getUserSession()
        const penaltyId = randomUUID()
        const vehicleLicenseIdentifier = 'vehicle-license-identifier'
        const fixingDate = new Date()
        const undefinedValue = undefined

        it.each([
            [
                'should successfully publish user penalty identified',
                <EventPayload>{
                    fixingDate,
                    penaltyId,
                    vehicleLicenseIdentifier,
                },
                (): void => {
                    jest.spyOn(userDocumentServiceMock, 'identifyPenaltyOwner').mockResolvedValueOnce(identifier)
                    jest.spyOn(eventBusMock, 'publish').mockResolvedValueOnce(true)
                },
                (): void => {
                    expect(userDocumentServiceMock.identifyPenaltyOwner).toHaveBeenCalledWith('vehicle-license-identifier', fixingDate)
                    expect(loggerMock.info).toHaveBeenCalledWith('Identified penalty', {
                        penaltyId,
                        penaltyFixingDate: fixingDate,
                        userIdentifier: identifier,
                    })
                    expect(analyticsServiceMock.log).toHaveBeenCalledWith(
                        AnalyticsCategory.Penalties,
                        identifier,
                        { penaltyId },
                        AnalyticsActionType.AddPenalty,
                    )
                    expect(eventBusMock.publish).toHaveBeenCalledWith(InternalEvent.UserPenaltyIdentified, {
                        penaltyId,
                        penaltyFixingDate: fixingDate,
                        userIdentifier: identifier,
                    })
                },
            ],
            [
                'should just return in case vehicleLicenseIdentifier is not present',
                <EventPayload>{
                    fixingDate,
                    penaltyId,
                    vehicleLicenseIdentifier,
                },
                (): void => {},
                (): void => {},
            ],
            [
                'should just return in case penalty owner not found',
                <EventPayload>{
                    fixingDate,
                    penaltyId,
                },
                (): void => {
                    jest.spyOn(userDocumentServiceMock, 'identifyPenaltyOwner').mockResolvedValueOnce(undefinedValue)
                },
                (): void => {
                    expect(userDocumentServiceMock.identifyPenaltyOwner).toHaveBeenCalledWith('vehicle-license-identifier', fixingDate)
                },
            ],
        ])('%s', async (_msg: string, message: EventPayload, defineSpies: CallableFunction, checkExpectations: CallableFunction) => {
            defineSpies()

            expect(await publicServicePenaltyCreatedEventListener.handler(message)).toBeUndefined()

            checkExpectations()
        })
    })
})
