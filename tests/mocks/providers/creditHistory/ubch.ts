import { ExternalCommunicator } from '@diia-inhouse/diia-queue'
import { HttpStatusCode } from '@diia-inhouse/types'

import { OperationState, UbchResponse, UbchResponseData } from '@interfaces/providers/creditHistory/ubch'

export default class UbchNock {
    constructor(private readonly external: ExternalCommunicator) {}

    async subscribe(subId: string, fail?: boolean): Promise<jest.SpyInstance> {
        const subResponseData: UbchResponseData = {
            name: '',
            message: '',
            code: 1,
            status: fail ? HttpStatusCode.BAD_REQUEST : HttpStatusCode.OK,
            type: '',
            data: {
                inn: '',
                refagr: subId,
                servicestate: OperationState.Y,
            },
        }
        const subResponse: UbchResponse = { data: Buffer.from(JSON.stringify(subResponseData)).toString('base64') }

        return jest.spyOn(this.external, 'receive').mockImplementationOnce(async () => subResponse)
    }

    async unsubscribe(_: string, __: string, fail?: boolean): Promise<jest.SpyInstance> {
        const unsubResponseData: UbchResponseData = {
            name: '',
            message: '',
            code: 1,
            status: fail ? HttpStatusCode.BAD_REQUEST : HttpStatusCode.OK,
            type: '',
        }

        const subResponse: UbchResponse = { data: Buffer.from(JSON.stringify(unsubResponseData)).toString('base64') }

        return jest.spyOn(this.external, 'receive').mockImplementationOnce(async () => subResponse)
    }
}
