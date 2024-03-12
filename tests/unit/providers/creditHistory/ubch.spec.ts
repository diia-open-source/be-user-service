import { randomUUID } from 'crypto'

import DiiaLogger from '@diia-inhouse/diia-logger'
import { ExternalCommunicator, ExternalEvent } from '@diia-inhouse/diia-queue'
import { ServiceUnavailableError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { HttpStatusCode } from '@diia-inhouse/types'

import UbchProvider from '@providers/creditHistory/ubch'

import { AppConfig } from '@interfaces/config'
import { OperationState, SubscribeRequestLng } from '@interfaces/providers/creditHistory/ubch'

describe('UbchProvider', () => {
    const testKit = new TestKit()
    const externalCommunicatorMock = mockInstance(ExternalCommunicator)
    const config = { ubch: { staticSessid: randomUUID() } }
    const loggerMock = mockInstance(DiiaLogger)
    const ubchProvider = new UbchProvider(<AppConfig>config, externalCommunicatorMock, loggerMock)
    const {
        user: { itn },
    } = testKit.session.getUserSession()

    describe('method: `subscribe`', () => {
        it('should successfully subscribe', async () => {
            const subId = randomUUID()
            const responseData = {
                status: HttpStatusCode.OK,
                data: {
                    inn: itn,
                    refagr: subId,
                    servicestate: OperationState.Y,
                },
            }

            jest.spyOn(externalCommunicatorMock, 'receive').mockResolvedValueOnce({
                data: Buffer.from(JSON.stringify(responseData)).toString('base64'),
            })

            expect(await ubchProvider.subscribe(itn)).toEqual(subId)

            expect(externalCommunicatorMock.receive).toHaveBeenCalledWith(ExternalEvent.UbkiCreditInfo, {
                data: Buffer.from(
                    JSON.stringify({
                        method: 'Rega',
                        sessid: config.ubch.staticSessid,
                        inn: itn,
                        lng: SubscribeRequestLng.Ua,
                    }),
                ).toString('base64'),
            })
        })

        it.each([
            [
                'ubch request failed',
                new Error('Unable to make request'),
                (): void => {
                    jest.spyOn(externalCommunicatorMock, 'receive').mockRejectedValueOnce(new Error('Unable to make request'))
                },
                (): void => {
                    expect(loggerMock.fatal).toHaveBeenCalledWith('Ubch request failed', { err: expect.any(Error) })
                },
            ],
            [
                'response status is not ok',
                new ServiceUnavailableError(`Failed to make UBCH request. Status: ${HttpStatusCode.BAD_REQUEST}`),
                (): void => {
                    jest.spyOn(externalCommunicatorMock, 'receive').mockResolvedValueOnce({
                        data: Buffer.from(JSON.stringify({ status: HttpStatusCode.BAD_REQUEST })).toString('base64'),
                    })
                },
                (): void => {
                    expect(loggerMock.fatal).toHaveBeenCalledWith('Failed to receive ubch data', {
                        requestData: {
                            method: 'Rega',
                            sessid: config.ubch.staticSessid,
                            inn: itn,
                            lng: SubscribeRequestLng.Ua,
                        },
                        response: { status: HttpStatusCode.BAD_REQUEST },
                    })
                },
            ],
            [
                'no refagr in response',
                new ServiceUnavailableError('Failed to receive UBCH subscription id'),
                (): void => {
                    jest.spyOn(externalCommunicatorMock, 'receive').mockResolvedValueOnce({
                        data: Buffer.from(JSON.stringify({ status: HttpStatusCode.OK })).toString('base64'),
                    })
                },
                (): void => {},
            ],
        ])(
            'should fail with error in case %s',
            async (_msg: string, expectedError: Error, defineSpies: CallableFunction, checkExpectations: CallableFunction) => {
                defineSpies()

                await expect(async () => {
                    await ubchProvider.subscribe(itn)
                }).rejects.toEqual(expectedError)

                checkExpectations()

                expect(externalCommunicatorMock.receive).toHaveBeenCalledWith(ExternalEvent.UbkiCreditInfo, {
                    data: Buffer.from(
                        JSON.stringify({
                            method: 'Rega',
                            sessid: config.ubch.staticSessid,
                            inn: itn,
                            lng: SubscribeRequestLng.Ua,
                        }),
                    ).toString('base64'),
                })
            },
        )
    })

    describe('method: `publishSubscription`', () => {
        it('should successfully publish subscription', async () => {
            jest.spyOn(externalCommunicatorMock, 'receive').mockResolvedValueOnce({
                data: Buffer.from(JSON.stringify({ status: HttpStatusCode.OK })).toString('base64'),
            })

            expect(await ubchProvider.publishSubscription(itn)).toBeUndefined()

            expect(externalCommunicatorMock.receive).toHaveBeenCalledWith(
                ExternalEvent.UbkiCreditInfo,
                {
                    data: Buffer.from(
                        JSON.stringify({
                            method: 'Rega',
                            sessid: config.ubch.staticSessid,
                            inn: itn,
                            lng: SubscribeRequestLng.Ua,
                        }),
                    ).toString('base64'),
                },
                { async: true },
            )
        })
    })

    describe('method: `unsubscribe`', () => {
        it('should successfully unsubscribe', async () => {
            const subId = randomUUID()

            jest.spyOn(externalCommunicatorMock, 'receive').mockResolvedValueOnce({
                data: Buffer.from(JSON.stringify({ status: HttpStatusCode.OK })).toString('base64'),
            })

            expect(await ubchProvider.unsubscribe(itn, subId)).toBeUndefined()

            expect(externalCommunicatorMock.receive).toHaveBeenCalledWith(ExternalEvent.UbkiCreditInfo, {
                data: Buffer.from(
                    JSON.stringify({
                        method: 'Disc',
                        sessid: config.ubch.staticSessid,
                        inn: itn,
                        lng: SubscribeRequestLng.Ua,
                        refagr: subId,
                    }),
                ).toString('base64'),
            })
        })
    })
})
