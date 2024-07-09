import TestKit, { mockInstance } from '@diia-inhouse/test'

import RemoveUserDocumentByIdAction from '@actions/v1/userDocument/removeUserDocumentById'

import AnalyticsService from '@services/analytics'
import UserDocumentService from '@services/userDocument'
import UserDocumentStorageService from '@services/userDocumentStorage'

describe(`Action ${RemoveUserDocumentByIdAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()

    const analyticsServiceMock = mockInstance(AnalyticsService)
    const subscriptionServiceMock = mockInstance(UserDocumentService)
    const userDocumentStorageServiceMock = mockInstance(UserDocumentStorageService)

    const removeUserDocumentByIdAction = new RemoveUserDocumentByIdAction(
        analyticsServiceMock,
        subscriptionServiceMock,
        userDocumentStorageServiceMock,
        [],
    )

    describe('method `handler`', () => {
        it('should successfully remove user document by id', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    documentType: 'driver-license',
                    documentId: 'documentId',
                    mobileUid: headers.mobileUid,
                },
                headers,
            }

            const analyticsHeaders = undefined

            jest.spyOn(analyticsServiceMock, 'getHeaders').mockReturnValueOnce(analyticsHeaders)
            jest.spyOn(subscriptionServiceMock, 'removeUserDocumentById').mockResolvedValueOnce()
            jest.spyOn(userDocumentStorageServiceMock, 'removeFromStorageById').mockResolvedValueOnce()

            await removeUserDocumentByIdAction.handler(args)

            expect(subscriptionServiceMock.removeUserDocumentById).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.documentType,
                args.params.documentId,
                args.headers.mobileUid,
                analyticsHeaders,
            )
            expect(userDocumentStorageServiceMock.removeFromStorageById).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.documentType,
                args.params.documentId,
                args.headers.mobileUid,
            )
        })
    })
})
