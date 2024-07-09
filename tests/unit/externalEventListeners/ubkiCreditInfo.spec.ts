import { randomUUID } from 'node:crypto'

const creditHistoryStrategyServiceStubs = {
    getModifier: jest.fn(),
}

class CreditHistoryStrategyServiceMock {
    getModifier(...args: unknown[]): unknown {
        return creditHistoryStrategyServiceStubs.getModifier(...args)
    }
}

jest.mock('@services/subscription/strategies/creditHistory', () => CreditHistoryStrategyServiceMock)

import { IdentifierService } from '@diia-inhouse/crypto'
import DiiaLogger from '@diia-inhouse/diia-logger'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { HttpStatusCode } from '@diia-inhouse/types'

import UbkiCreditInfoEventListener from '@src/externalEventListeners/ubkiCreditInfo'

import SubscriptionService from '@services/subscription'

import UbchProvider from '@providers/creditHistory/ubch'

import { OperationState, UbchResponseData } from '@interfaces/providers/creditHistory/ubch'

describe('UbkiCreditInfoEventListener', () => {
    const testKit = new TestKit()
    const ubchProviderMock = mockInstance(UbchProvider)
    const subscriptionServiceMock = mockInstance(SubscriptionService)
    const identifierServiceMock = mockInstance(IdentifierService)
    const loggerMock = mockInstance(DiiaLogger)
    const ubkiCreditInfoEventListener = new UbkiCreditInfoEventListener(
        ubchProviderMock,
        subscriptionServiceMock,
        identifierServiceMock,
        loggerMock,
    )

    describe('method: `handler`', () => {
        const {
            user: { itn, identifier },
        } = testKit.session.getUserSession()

        it.each([
            [
                'itn and refarg is present',
                {
                    inn: itn,
                    refagr: randomUUID(),
                    servicestate: OperationState.Y,
                },
            ],
            [
                'itn and refarg is not present',
                {
                    inn: '',
                    refagr: '',
                    servicestate: OperationState.N,
                },
            ],
        ])('should successfully update user subscription with credit history when %s', async (_msg, ubchData) => {
            const message = {
                uuid: randomUUID(),
                response: {
                    data: 'data',
                },
            }
            const ubchResponse = {
                code: 1000,
                message: 'message',
                name: 'name',
                status: HttpStatusCode.OK,
                type: 'type',
                data: ubchData,
            }
            const modifier = {}
            const {
                data: { refagr },
            } = ubchResponse

            jest.spyOn(ubchProviderMock, 'parseResponseData').mockReturnValueOnce(ubchResponse)
            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(identifier)
            creditHistoryStrategyServiceStubs.getModifier.mockReturnValueOnce(modifier)
            jest.spyOn(subscriptionServiceMock, 'updateByUserIdentifier').mockResolvedValueOnce()

            expect(await ubkiCreditInfoEventListener.handler(message)).toBeUndefined()

            expect(ubchProviderMock.parseResponseData).toHaveBeenCalledWith(message.response.data)
            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(itn)
            expect(creditHistoryStrategyServiceStubs.getModifier).toHaveBeenCalledWith(identifier, refagr, true)
            expect(subscriptionServiceMock.updateByUserIdentifier).toHaveBeenCalledWith(identifier, modifier)
        })

        it('should just log fatal in case ubch response status is not ok', async () => {
            const message = {
                uuid: randomUUID(),
                response: {
                    data: 'data',
                },
            }
            const ubchResponse = {
                status: HttpStatusCode.BAD_REQUEST,
            }

            jest.spyOn(ubchProviderMock, 'parseResponseData').mockReturnValueOnce(<UbchResponseData>ubchResponse)

            expect(await ubkiCreditInfoEventListener.handler(message)).toBeUndefined()

            expect(ubchProviderMock.parseResponseData).toHaveBeenCalledWith(message.response.data)
            expect(loggerMock.fatal).toHaveBeenCalledWith('Failed to receive ubch data async', ubchResponse)
        })
    })
})
