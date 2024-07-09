import { randomUUID } from 'node:crypto'

import DiiaLogger from '@diia-inhouse/diia-logger'
import { InternalServerError, ServiceUnavailableError } from '@diia-inhouse/errors'
import { HttpService } from '@diia-inhouse/http'
import { CacheService, Lock, RedlockService } from '@diia-inhouse/redis'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { HttpStatusCode } from '@diia-inhouse/types'

import UbchRestProvider from '@providers/creditHistory/ubchRest'

import { AppConfig } from '@interfaces/config'
import { SubscribeRequestLng } from '@interfaces/providers/creditHistory/ubch'

const config = {
    ubch: {
        authPath: '/auth',
        host: 'ubch.host.ua',
        isEnabled: true,
        login: 'login',
        password: 'password',
        staticSessid: randomUUID(),
        subscribePath: '/subscribe',
        unsubscribePath: '/unsubscribe',
    },
    app: {
        integrationPointsTimeout: 30000,
    },
}

describe('UbchRestProvider', () => {
    const testKit = new TestKit()
    const httpServiceMock = mockInstance(HttpService)
    const cacheServiceMock = mockInstance(CacheService)
    const redlockServiceMock = mockInstance(RedlockService)
    const loggerMock = mockInstance(DiiaLogger)
    const ubchRestProvider = new UbchRestProvider(<AppConfig>config, httpServiceMock, cacheServiceMock, redlockServiceMock, loggerMock)
    const {
        user: { itn },
    } = testKit.session.getUserSession()
    const lock = { release: jest.fn() }

    describe('method: `subscribe`', () => {
        it('should successfully subscribe when session id is not present in cache', async () => {
            const sessionId = randomUUID()
            const subId = randomUUID()

            jest.spyOn(redlockServiceMock, 'lock').mockResolvedValueOnce(<Lock>(<unknown>lock))
            jest.spyOn(cacheServiceMock, 'get').mockResolvedValueOnce(null)
            jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([null, { data: { doc: { auth: { sessid: sessionId } } } }])
            jest.spyOn(cacheServiceMock, 'set').mockResolvedValueOnce('OK')
            jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([
                null,
                { statusCode: HttpStatusCode.OK, data: { data: { refagr: subId } } },
            ])

            expect(await ubchRestProvider.subscribe(itn)).toEqual(subId)

            expect(redlockServiceMock.lock).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKeyLock)
            expect(cacheServiceMock.get).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKey)
            expect(loggerMock.info).toHaveBeenCalledWith('Start getting Ubch session id')
            expect(httpServiceMock.post).toHaveBeenCalledWith(
                {
                    host: config.ubch.host,
                    path: config.ubch.authPath,
                    rejectUnauthorized: false,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                },
                undefined,
                JSON.stringify({
                    doc: {
                        auth: {
                            login: config.ubch.login,
                            pass: config.ubch.password,
                        },
                    },
                }),
            )
            expect(cacheServiceMock.set).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKey, sessionId)
            expect(loggerMock.info).toHaveBeenCalledWith('Received Ubch sessionId')
            expect(lock.release).toHaveBeenCalledWith()
            expect(httpServiceMock.post).toHaveBeenCalledWith(
                {
                    host: config.ubch.host,
                    path: config.ubch.subscribePath,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    rejectUnauthorized: false,
                    timeout: config.app.integrationPointsTimeout,
                },
                undefined,
                JSON.stringify({ inn: itn, sessid: sessionId, lng: SubscribeRequestLng.Ua }),
            )
            expect(loggerMock.debug).toHaveBeenCalledWith('Ubch registry response', { data: { refagr: subId } })
        })

        it('should successfully subscribe when session id is present in cache', async () => {
            const sessionId = randomUUID()
            const subId = randomUUID()

            jest.spyOn(redlockServiceMock, 'lock').mockResolvedValueOnce(<Lock>(<unknown>lock))
            jest.spyOn(cacheServiceMock, 'get').mockResolvedValueOnce(sessionId)
            lock.release.mockResolvedValueOnce('ok')
            jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([
                null,
                { statusCode: HttpStatusCode.OK, data: { data: { refagr: subId } } },
            ])

            expect(await ubchRestProvider.subscribe(itn)).toEqual(subId)

            expect(redlockServiceMock.lock).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKeyLock)
            expect(cacheServiceMock.get).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKey)
            expect(lock.release).toHaveBeenCalledWith()
            expect(httpServiceMock.post).toHaveBeenCalledWith(
                {
                    host: config.ubch.host,
                    path: config.ubch.subscribePath,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    rejectUnauthorized: false,
                    timeout: config.app.integrationPointsTimeout,
                },
                undefined,
                JSON.stringify({ inn: itn, sessid: sessionId, lng: SubscribeRequestLng.Ua }),
            )
            expect(loggerMock.debug).toHaveBeenCalledWith('Ubch registry response', { data: { refagr: subId } })
        })

        it('should fail with error in case ubch auth failed', async () => {
            const expectedError = new InternalServerError('Ubch auth failed')

            jest.spyOn(redlockServiceMock, 'lock').mockResolvedValueOnce(<Lock>(<unknown>lock))
            jest.spyOn(cacheServiceMock, 'get').mockResolvedValueOnce(null)
            jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([null, { data: { doc: { auth: {} } } }])
            lock.release.mockResolvedValueOnce('ok')

            await expect(async () => {
                await ubchRestProvider.subscribe(itn)
            }).rejects.toEqual(expectedError)

            expect(redlockServiceMock.lock).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKeyLock)
            expect(cacheServiceMock.get).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKey)
            expect(loggerMock.info).toHaveBeenCalledWith('Start getting Ubch session id')
            expect(httpServiceMock.post).toHaveBeenCalledWith(
                {
                    host: config.ubch.host,
                    path: config.ubch.authPath,
                    rejectUnauthorized: false,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                },
                undefined,
                JSON.stringify({
                    doc: {
                        auth: {
                            login: config.ubch.login,
                            pass: config.ubch.password,
                        },
                    },
                }),
            )
            expect(loggerMock.info).toHaveBeenCalledWith('Retrieving Ubch session id error:', {
                responseData: { doc: { auth: {} } },
                err: null,
            })
            expect(lock.release).toHaveBeenCalledWith()
        })

        it.each([
            [
                'unauthorized request to the Ubch service',
                new ServiceUnavailableError('Unauthorized request to the Ubch service'),
                (): void => {
                    const sessionId = randomUUID()

                    jest.spyOn(redlockServiceMock, 'lock').mockResolvedValue(<Lock>(<unknown>lock))
                    jest.spyOn(cacheServiceMock, 'get').mockResolvedValue(sessionId)
                    lock.release.mockResolvedValueOnce('ok')
                    jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([null, { statusCode: <HttpStatusCode>410 }])
                    jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([null, { data: { doc: { auth: { sessid: sessionId } } } }])
                    jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([null, { statusCode: <HttpStatusCode>410 }])
                },
                (): void => {},
            ],
            [
                'Ubch service unknown error',
                new ServiceUnavailableError('Ubch service unknown error'),
                (): void => {
                    const sessionId = randomUUID()

                    jest.spyOn(redlockServiceMock, 'lock').mockResolvedValue(<Lock>(<unknown>lock))
                    jest.spyOn(cacheServiceMock, 'get').mockResolvedValue(sessionId)
                    jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([null, { statusCode: <HttpStatusCode>410 }])
                    jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([null, { data: { doc: { auth: { sessid: sessionId } } } }])
                    jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([null, { statusCode: HttpStatusCode.GATEWAY_TIMEOUT }])
                },
                (): void => {
                    expect(loggerMock.fatal).toHaveBeenCalledWith('Ubch unknown error', {
                        statusCode: HttpStatusCode.GATEWAY_TIMEOUT,
                        responseData: undefined,
                    })
                },
            ],
            [
                'subscription id is not received',
                new ServiceUnavailableError('Failed to receive ubch subscription id'),
                (): void => {
                    const sessionId = randomUUID()

                    jest.spyOn(redlockServiceMock, 'lock').mockResolvedValueOnce(<Lock>(<unknown>lock))
                    jest.spyOn(cacheServiceMock, 'get').mockResolvedValueOnce(sessionId)
                    jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([null, { statusCode: HttpStatusCode.OK, data: { data: {} } }])
                },
                (): void => {
                    expect(loggerMock.fatal).toHaveBeenCalledWith('Failed to receive ubch subscription id', { data: {} })
                },
            ],
        ])(
            'should fail with error in case %s',
            async (_msg: string, expectedError: Error, defineSpies: CallableFunction, checkExpectations: CallableFunction) => {
                defineSpies()

                await expect(async () => {
                    await ubchRestProvider.subscribe(itn)
                }).rejects.toEqual(expectedError)

                checkExpectations()
            },
        )
    })

    describe('method: `publishSubscription`', () => {
        it('should fail with error', async () => {
            await expect(async () => {
                await ubchRestProvider.publishSubscription()
            }).rejects.toEqual(new Error('Method not implemented.'))
        })
    })

    describe('method: `unsubscribe`', () => {
        it('should successfully unsubscribe', async () => {
            const sessionId = randomUUID()
            const subId = randomUUID()

            jest.spyOn(redlockServiceMock, 'lock').mockResolvedValueOnce(<Lock>(<unknown>lock))
            jest.spyOn(cacheServiceMock, 'get').mockResolvedValueOnce(sessionId)
            lock.release.mockResolvedValueOnce('ok')
            jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([
                null,
                { statusCode: HttpStatusCode.OK, data: { status: HttpStatusCode.OK } },
            ])

            expect(await ubchRestProvider.unsubscribe(subId)).toBeUndefined()

            expect(redlockServiceMock.lock).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKeyLock)
            expect(cacheServiceMock.get).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKey)
            expect(lock.release).toHaveBeenCalledWith()
            expect(httpServiceMock.post).toHaveBeenCalledWith(
                {
                    host: config.ubch.host,
                    path: config.ubch.unsubscribePath,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    rejectUnauthorized: false,
                    timeout: config.app.integrationPointsTimeout,
                },
                undefined,
                JSON.stringify({ refagr: subId, sessid: sessionId, lng: SubscribeRequestLng.Ua }),
            )
        })

        it('should fail with error in case status is not ok', async () => {
            const sessionId = randomUUID()
            const subId = randomUUID()

            jest.spyOn(redlockServiceMock, 'lock').mockResolvedValueOnce(<Lock>(<unknown>lock))
            jest.spyOn(cacheServiceMock, 'get').mockResolvedValueOnce(sessionId)
            lock.release.mockResolvedValueOnce('ok')
            jest.spyOn(httpServiceMock, 'post').mockResolvedValueOnce([
                null,
                { statusCode: HttpStatusCode.OK, data: { status: HttpStatusCode.INTERNAL_SERVER_ERROR } },
            ])

            await expect(async () => {
                await ubchRestProvider.unsubscribe(subId)
            }).rejects.toEqual(new ServiceUnavailableError(`Failed to unsubscribe from the ubch: ${HttpStatusCode.INTERNAL_SERVER_ERROR}`))

            expect(redlockServiceMock.lock).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKeyLock)
            expect(cacheServiceMock.get).toHaveBeenCalledWith(ubchRestProvider.sessionIdCacheKey)
            expect(lock.release).toHaveBeenCalledWith()
            expect(httpServiceMock.post).toHaveBeenCalledWith(
                {
                    host: config.ubch.host,
                    path: config.ubch.unsubscribePath,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    rejectUnauthorized: false,
                    timeout: config.app.integrationPointsTimeout,
                },
                undefined,
                JSON.stringify({ refagr: subId, sessid: sessionId, lng: SubscribeRequestLng.Ua }),
            )
        })
    })
})
