import Logger from '@diia-inhouse/diia-logger'
import { mockInstance } from '@diia-inhouse/test'

import CheckCovidCertificatesExpirationsTask from '@src/scheduledTasks/checkCovidCertificatesExpirations'

import UserDocumentService from '@services/userDocument'

import { ScheduledTaskEvent } from '@interfaces/queue'

describe(`Scheduled Task ${CheckCovidCertificatesExpirationsTask.name}`, () => {
    const logger = mockInstance(Logger)
    const userDocumentService = mockInstance(UserDocumentService)
    const scheduledTask = new CheckCovidCertificatesExpirationsTask(userDocumentService, logger)

    it('should call userDocumentService.checkInternationalVaccinationCertificatesExpirations', async () => {
        await scheduledTask.handler()

        expect(scheduledTask.event).toBe(ScheduledTaskEvent.UserCheckCovidCertificatesExpirations)
        expect(logger.info).toHaveBeenCalledWith('Start checking covid certificates expirations for notifications')
        expect(userDocumentService.checkInternationalVaccinationCertificatesExpirations).toHaveBeenCalled()
    })
})
