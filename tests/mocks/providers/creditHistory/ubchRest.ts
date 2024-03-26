import nock from 'nock'
import { randomUUID as uuid } from 'node:crypto'

import { HttpStatusCode } from '@diia-inhouse/types'

import UbchRestProvider from '@providers/creditHistory/ubchRest'

import { OperationState } from '@interfaces/providers/creditHistory/ubch'
import { AuthResponse, SubscribeResponse, UnsubscribeResponse } from '@interfaces/providers/creditHistory/ubchRest'

export default class UbchNock {
    private readonly host: string

    constructor(private readonly ubchRestProvider: UbchRestProvider) {
        this.host = `https://${ubchRestProvider.host}`
    }

    persistAuth(): nock.Scope {
        const authResponse: AuthResponse = { doc: { auth: { sessid: uuid() } } }

        return nock(this.host).post(this.ubchRestProvider.authPath).reply(HttpStatusCode.OK, authResponse).persist()
    }

    async subscribe(subId: string, fail?: boolean): Promise<nock.Scope> {
        const subResponse: SubscribeResponse = {
            name: '',
            message: 'OK',
            code: 0,
            status: HttpStatusCode.OK,
            type: '',
            data: {
                refagr: subId,
                operationstate: OperationState.Y,
                servicestate: OperationState.Y,
            },
        }

        const scope: nock.Scope = nock(this.host)
            .post(this.ubchRestProvider.subscribePath)
            .reply(HttpStatusCode.OK, fail ? undefined : subResponse)

        return scope
    }

    async unsubscribe(itn: string, subId: string, fail?: boolean): Promise<nock.Scope> {
        const unsubResponse: UnsubscribeResponse = {
            name: '',
            message: 'OK',
            code: 0,
            status: HttpStatusCode.OK,
            type: '',
            data: {
                inn: itn,
                refagr: subId,
                operationstate: OperationState.Y,
                servicestate: OperationState.Y,
            },
        }

        const scope: nock.Scope = nock(this.host)
            .post(this.ubchRestProvider.unsubscribePath)
            .reply(HttpStatusCode.OK, fail ? { ...unsubResponse, status: HttpStatusCode.BAD_REQUEST } : unsubResponse)

        return scope
    }
}
