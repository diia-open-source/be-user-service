import { ExternalCommunicator } from '@diia-inhouse/diia-queue'
import { ServiceUnavailableError } from '@diia-inhouse/errors'
import { HttpStatusCode, Logger } from '@diia-inhouse/types'

import { AppConfig } from '@interfaces/config'
import { CreditHistoryProvider } from '@interfaces/providers/creditHistory'
import {
    SubscribeRequestData,
    SubscribeRequestLng,
    UbchRequest,
    UbchRequestData,
    UbchResponse,
    UbchResponseData,
    UnsubscribeRequestData,
} from '@interfaces/providers/creditHistory/ubch'
import { ExternalEvent } from '@interfaces/queue'

export default class UbchProvider implements CreditHistoryProvider {
    private readonly sessid: string

    private readonly lng: SubscribeRequestLng = SubscribeRequestLng.Ua

    constructor(
        private readonly config: AppConfig,
        private readonly external: ExternalCommunicator,
        private readonly logger: Logger,
    ) {
        this.logger.info('Enabled ubch provider')
        this.sessid = this.config.ubch.staticSessid
    }

    async subscribe(itn: string): Promise<string> {
        const requestData: SubscribeRequestData = this.getSubscribeRequestData(itn)
        const response: UbchResponseData['data'] = await this.makeRequest(requestData)
        if (!response?.refagr) {
            throw new ServiceUnavailableError('Failed to receive UBCH subscription id')
        }

        return response.refagr
    }

    async publishSubscription(itn: string): Promise<void> {
        const requestData: SubscribeRequestData = this.getSubscribeRequestData(itn)

        await this.publishRequest(requestData)
    }

    async unsubscribe(itn: string, subId: string): Promise<void> {
        const requestData: UnsubscribeRequestData = {
            method: 'Disc',
            sessid: this.sessid,
            inn: itn,
            lng: this.lng,
            refagr: subId,
        }

        await this.makeRequest(requestData)
    }

    parseResponseData(base64Data: string): UbchResponseData {
        const json: string = Buffer.from(base64Data, 'base64').toString()
        const response: UbchResponseData = JSON.parse(json)

        return response
    }

    private getSubscribeRequestData(itn: string): SubscribeRequestData {
        return {
            method: 'Rega',
            sessid: this.sessid,
            inn: itn,
            lng: this.lng,
        }
    }

    private getUbchRequest(requestData: UbchRequestData): UbchRequest {
        return { data: Buffer.from(JSON.stringify(requestData)).toString('base64') }
    }

    private async publishRequest(requestData: UbchRequestData): Promise<void> {
        const request: UbchRequest = this.getUbchRequest(requestData)

        await this.external.receive(ExternalEvent.UbkiCreditInfo, request, { async: true })
    }

    private async makeRequest(requestData: UbchRequestData): Promise<UbchResponseData['data']> {
        const request: UbchRequest = this.getUbchRequest(requestData)
        try {
            const externalResponse = await this.external.receive<UbchResponse>(ExternalEvent.UbkiCreditInfo, request)
            if (!externalResponse) {
                throw new ServiceUnavailableError('No ubch response')
            }

            const response: UbchResponseData = this.parseResponseData(externalResponse.data)
            const { status, data: responseData } = response
            if (status !== HttpStatusCode.OK) {
                this.logger.fatal('Failed to receive ubch data', { requestData, response })

                throw new ServiceUnavailableError(`Failed to make UBCH request. Status: ${status}`)
            }

            return responseData
        } catch (err) {
            this.logger.fatal('Ubch request failed', { err })

            throw err
        }
    }
}
