import { randomUUID } from 'crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocStatus, DocumentType, DurationMs, OwnerType } from '@diia-inhouse/types'

import AddDocumentsInProfileEventListener from '@src/eventListeners/addDocumentsInProfile'

import AnalyticsService from '@services/analytics'
import SubscriptionService from '@services/subscription'
import UserDocumentService from '@services/userDocument'

describe(`Event listener ${AddDocumentsInProfileEventListener.name}`, () => {
    const testKit = new TestKit()

    const analyticsService = mockInstance(AnalyticsService)
    const subscriptionService = mockInstance(SubscriptionService)
    const userDocumentService = mockInstance(UserDocumentService)

    const eventListener = new AddDocumentsInProfileEventListener(analyticsService, userDocumentService, subscriptionService)

    it('should call updateDocument and updateDocumentsSubscriptions with right parameters', async () => {
        const { session, headers } = testKit.session.getUserActionArguments()
        const { mobileUid } = headers
        const { user } = session
        const { identifier: userIdentifier } = user
        const documentType = DocumentType.DriverLicense
        const document = {
            docId: randomUUID(),
            docStatus: DocStatus.Ok,
            documentIdentifier: randomUUID(),
            documentType,
            ownerType: OwnerType.owner,
            registrationDate: new Date(Date.now() - DurationMs.Day),
            userIdentifier,
        }

        const analyticsHeaders = undefined

        jest.spyOn(analyticsService, 'getHeaders').mockReturnValueOnce(analyticsHeaders)
        const updateDocumentsSpy = jest.spyOn(userDocumentService, 'updateDocuments').mockResolvedValueOnce()
        const updateDocumentsSubscriptionsSpy = jest.spyOn(subscriptionService, 'updateDocumentsSubscriptions').mockResolvedValueOnce()

        await eventListener.handler({
            userIdentifier,
            documentType,
            headers,
            documents: [document],
            removeMissingDocuments: true,
        })

        expect(updateDocumentsSpy).toHaveBeenCalledWith(userIdentifier, documentType, [document], mobileUid, analyticsHeaders, true)
        expect(updateDocumentsSubscriptionsSpy).toHaveBeenCalledWith(userIdentifier, documentType, [document], analyticsHeaders)
    })
})
