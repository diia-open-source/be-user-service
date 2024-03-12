import { InternalServerError, ServiceUnavailableError } from '@diia-inhouse/errors'
import { HttpService, HttpServiceResponse, HttpServiceResponseResult } from '@diia-inhouse/http'
import { CacheService, RedlockService } from '@diia-inhouse/redis'
import { HttpStatusCode, Logger } from '@diia-inhouse/types'

import { AppConfig } from '@interfaces/config'
import { CreditHistoryProvider } from '@interfaces/providers/creditHistory'
import { SubscribeRequestLng } from '@interfaces/providers/creditHistory/ubch'
import {
    AuthRequest,
    AuthResponse,
    BaseRequest,
    SubscribeRequest,
    SubscribeResponse,
    UbchRequest,
    UnsubscribeRequest,
    UnsubscribeResponse,
} from '@interfaces/providers/creditHistory/ubchRest'

export default class UbchRestProvider implements CreditHistoryProvider {
    readonly host: string

    readonly authPath: string

    readonly subscribePath: string

    readonly unsubscribePath: string

    readonly sessionIdCacheKey: string = 'ubch_session_id'

    readonly sessionIdCacheKeyLock: string = `${this.sessionIdCacheKey}:lock`

    constructor(
        private readonly config: AppConfig,
        private readonly httpsService: HttpService,
        private readonly cache: CacheService,
        private readonly redlock: RedlockService,
        private readonly logger: Logger,
    ) {
        const { host, authPath, subscribePath, unsubscribePath } = this.config.ubch

        this.host = host
        this.authPath = authPath
        this.subscribePath = subscribePath
        this.unsubscribePath = unsubscribePath
        this.logger.info('Enabled ubch rest provider')
    }

    async subscribe(itn: string): Promise<string> {
        const request: SubscribeRequest = { inn: itn }
        const response: SubscribeResponse = await this.getResource(this.subscribePath, request)
        const subId: string = response?.data?.refagr
        if (!subId) {
            const errorMsg = 'Failed to receive ubch subscription id'

            this.logger.fatal(errorMsg, response)

            throw new ServiceUnavailableError(errorMsg)
        }

        return subId
    }

    publishSubscription(): Promise<void> {
        throw new Error('Method not implemented.')
    }

    async unsubscribe(subId: string): Promise<void> {
        const request: UnsubscribeRequest = {
            refagr: subId,
        }
        const response: UnsubscribeResponse = await this.getResource(this.unsubscribePath, request)
        if (response.status !== HttpStatusCode.OK) {
            throw new ServiceUnavailableError(`Failed to unsubscribe from the ubch: ${response.status}`)
        }
    }

    private async getResource<T>(path: string, data: UbchRequest, isRetry?: boolean): Promise<T> {
        const sessionId: string = await this.retrieveSessionId()
        const request: BaseRequest = { ...data, sessid: sessionId, lng: SubscribeRequestLng.Ua }
        const [receivedError, response = {}]: HttpServiceResponse = await this.makeApiCall(path, request)
        if (receivedError || response?.statusCode !== HttpStatusCode.OK) {
            return await this.processResponseError(receivedError || response, path, data, isRetry)
        }

        this.logger.debug('Ubch registry response', response?.data)

        return response?.data
    }

    private async processResponseError<T>(
        response: HttpServiceResponseResult,
        url: string,
        data: UbchRequest,
        isRetry?: boolean,
    ): Promise<T> | never {
        const { data: responseData, statusCode } = response

        this.logger.error('Ubch provider error', { url, statusCode, responseData, isRetry })
        switch (statusCode) {
            case <HttpStatusCode>410:
                if (!isRetry) {
                    await this.retrieveSessionId(true)

                    return await this.getResource(url, data, true)
                }

                throw new ServiceUnavailableError('Unauthorized request to the Ubch service')
            default:
                this.logger.fatal('Ubch unknown error', { statusCode, responseData })

                throw new ServiceUnavailableError('Ubch service unknown error')
        }
    }

    private async makeApiCall(path: string, data: BaseRequest): Promise<HttpServiceResponse> {
        this.logger.info('Making Ubch API call', { path })

        return await this.httpsService.post(
            {
                host: this.host,
                path,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                rejectUnauthorized: false,
                timeout: this.config.app.integrationPointsTimeout,
            },
            undefined,
            JSON.stringify(data),
        )
    }

    private async retrieveSessionId(refresh?: boolean): Promise<string> {
        const lock = await this.redlock.lock(this.sessionIdCacheKeyLock)
        const cachedSessionId = await this.cache.get(this.sessionIdCacheKey)
        if (cachedSessionId && !refresh) {
            await lock.release()

            return cachedSessionId
        }

        this.logger.info('Start getting Ubch session id')
        const data: AuthRequest = {
            doc: {
                auth: {
                    login: this.config.ubch.login,
                    pass: this.config.ubch.password,
                },
            },
        }

        const [err, response]: HttpServiceResponse = await this.httpsService.post(
            {
                host: this.host,
                path: this.authPath,
                rejectUnauthorized: false,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            },
            undefined,
            JSON.stringify(data),
        )

        const responseData: AuthResponse = response?.data
        if (err || !responseData?.doc.auth.sessid) {
            await lock.release()
            this.logger.info('Retrieving Ubch session id error:', { responseData, err })

            throw new InternalServerError('Ubch auth failed')
        }

        const sessionId: string = responseData.doc.auth.sessid

        await this.cache.set(this.sessionIdCacheKey, sessionId)
        this.logger.info('Received Ubch sessionId')

        await lock.release()

        return sessionId
    }
}
