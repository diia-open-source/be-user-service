import { UpdateQuery } from 'mongoose'

import { IdentifierService } from '@diia-inhouse/crypto'
import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { HttpStatusCode, Logger } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import SubscriptionService from '@services/subscription'
import CreditHistoryStrategyService from '@services/subscription/strategies/creditHistory'

import UbchProvider from '@providers/creditHistory/ubch'

import { EventPayload } from '@interfaces/externalEventListeners/ubkiCreditInfo'
import { SubscriptionModel } from '@interfaces/models/subscription'
import { UbchResponseData } from '@interfaces/providers/creditHistory/ubch'

export default class UbkiCreditInfoEventListener implements EventBusListener {
    private readonly creditHistoryStrategyService: CreditHistoryStrategyService

    constructor(
        private readonly ubchProvider: UbchProvider,
        private readonly subscriptionService: SubscriptionService,
        private readonly identifier: IdentifierService,
        private readonly logger: Logger,
    ) {
        this.creditHistoryStrategyService = new CreditHistoryStrategyService(this.ubchProvider, this.logger)
    }

    readonly event: ExternalEvent = ExternalEvent.UbkiCreditInfo

    readonly isSync: boolean = true

    readonly validationRules: ValidationSchema = {
        data: { type: 'string' },
    }

    async handler(payload: EventPayload): Promise<void> {
        const {
            response: { data },
        } = payload
        const response: UbchResponseData = this.ubchProvider.parseResponseData(data)
        const { status, data: responseData } = response
        if (status !== HttpStatusCode.OK || !responseData) {
            this.logger.fatal('Failed to receive ubch data async', response)

            return
        }

        const { inn, refagr } = responseData
        if (!refagr || !inn) {
            this.logger.fatal('Failed to receive ubch data async', responseData)
        }

        const userIdentifier: string = this.identifier.createIdentifier(inn)
        const modifier: UpdateQuery<SubscriptionModel> = this.creditHistoryStrategyService.getModifier(userIdentifier, refagr, true)

        await this.subscriptionService.updateByUserIdentifier(userIdentifier, modifier)
    }
}
