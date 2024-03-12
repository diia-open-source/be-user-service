import { EventBusListener, ScheduledTaskEvent } from '@diia-inhouse/diia-queue'
import { Logger } from '@diia-inhouse/types'

import UserDocumentService from '@services/userDocument'

export default class CheckDriverLicensesExpirationsTask implements EventBusListener {
    constructor(
        private readonly userDocumentService: UserDocumentService,
        private readonly logger: Logger,
    ) {}

    readonly event: ScheduledTaskEvent = ScheduledTaskEvent.UserCheckDriverLicensesExpirations

    async handler(): Promise<void> {
        this.logger.info('Start checking driver licenses expirations for notifications')

        await this.userDocumentService.checkDriverLicensesExpirations()
    }
}
