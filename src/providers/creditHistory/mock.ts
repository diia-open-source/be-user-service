import { v4 as uuid } from 'uuid'

import { Logger } from '@diia-inhouse/types'

import { CreditHistoryProvider } from '@interfaces/providers/creditHistory'

export default class UbchMockProvider implements CreditHistoryProvider {
    constructor(private readonly logger: Logger) {
        this.logger.info('Enabled ubch mock provider')
    }

    async subscribe(): Promise<string> {
        return uuid()
    }

    async publishSubscription(): Promise<void> {
        return
    }

    async unsubscribe(): Promise<void> {
        return
    }
}
