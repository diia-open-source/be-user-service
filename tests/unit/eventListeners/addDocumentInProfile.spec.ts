import { randomUUID } from 'crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocStatus, DocumentType, OwnerType } from '@diia-inhouse/types'

import AddDocumentInProfileEventListener from '@src/eventListeners/addDocumentInProfile'

import AnalyticsService from '@services/analytics'
import UserDocumentService from '@services/userDocument'

describe('AddDocumentInProfileEventListener', () => {
    const testKit = new TestKit()
    const analyticsServiceMock = mockInstance(AnalyticsService)
    const userDocumentServiceMock = mockInstance(UserDocumentService)
    const addDocumentInProfileEventListener = new AddDocumentInProfileEventListener(analyticsServiceMock, userDocumentServiceMock)

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const {
                user: { identifier },
            } = testKit.session.getUserSession()
            const message = {
                documentIdentifier: 'document-identifier',
                documentType: DocumentType.BirthCertificate,
                headers: testKit.session.getHeaders(),
                ownerType: OwnerType.owner,
                userIdentifier: identifier,
                docId: randomUUID(),
                docStatus: DocStatus.Ok,
            }
            const {
                documentType,
                documentIdentifier,
                ownerType,
                docId,
                docStatus,
                headers: { mobileUid },
            } = message

            const analyticsHeaders = undefined

            jest.spyOn(userDocumentServiceMock, 'addDocument').mockResolvedValueOnce(analyticsHeaders)

            const result = await addDocumentInProfileEventListener.handler(message)

            expect(result).toBeUndefined()

            expect(userDocumentServiceMock.addDocument).toHaveBeenCalledWith(
                identifier,
                documentType,
                { documentIdentifier, ownerType, docId, docStatus },
                mobileUid,
                analyticsHeaders,
            )
        })
    })
})
