import TestKit, { mockInstance } from '@diia-inhouse/test'
import { OwnerType } from '@diia-inhouse/types'

import GetSubscribedDocumentsAction from '@actions/v1/userDocument/getSubscribedDocuments'

import UserDocumentService from '@services/userDocument'

import { SubscriptionType } from '@interfaces/models/subscription'

describe(`Action ${GetSubscribedDocumentsAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentServiceMock = mockInstance(UserDocumentService)

    const getSubscribedDocumentsAction = new GetSubscribedDocumentsAction(userDocumentServiceMock, [])

    describe('method `handler`', () => {
        it('should return user documents', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    subscriptionType: SubscriptionType.Push,
                    documentType: 'birth-certificate',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const userDocuments = [
                {
                    userIdentifier: 'userIdentifier',
                    documentType: 'driver-license',
                    documentIdentifier: 'documentIdentifier',
                    ownerType: OwnerType.owner,
                    notifications: {},
                },
            ]

            jest.spyOn(userDocumentServiceMock, 'getUserDocuments').mockResolvedValueOnce(userDocuments)

            expect(await getSubscribedDocumentsAction.handler(args)).toMatchObject({ documents: userDocuments })

            expect(userDocumentServiceMock.getUserDocuments).toHaveBeenCalledWith({
                userIdentifier: args.params.userIdentifier,
                documentType: args.params.documentType,
            })
        })
    })
})
