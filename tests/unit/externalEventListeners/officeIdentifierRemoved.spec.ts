import { randomUUID } from 'node:crypto'

import { IdentifierService } from '@diia-inhouse/crypto'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ProfileFeature } from '@diia-inhouse/types'

import OfficeIdentifierRemovedEventListener from '@src/externalEventListeners/officeIdentifierRemoved'

import DocumentsService from '@services/documents'
import UserProfileService from '@services/userProfile'

describe('OfficeIdentifierRemovedEventListener', () => {
    const testKit = new TestKit()
    const userProfileServiceMock = mockInstance(UserProfileService)
    const documentsServiceMock = mockInstance(DocumentsService)
    const identifierServiceMock = mockInstance(IdentifierService)
    const officeIdentifierRemovedEventListener = new OfficeIdentifierRemovedEventListener(
        userProfileServiceMock,
        documentsServiceMock,
        identifierServiceMock,
    )

    describe('method: `handler`', () => {
        it('should successfully remove profile feature and expire document', async () => {
            const {
                user: { identifier, itn },
            } = testKit.session.getUserSession()
            const message = {
                uuid: randomUUID(),
                request: {
                    rnokpp: itn,
                },
            }

            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(identifier)
            jest.spyOn(userProfileServiceMock, 'removeProfileFeature').mockResolvedValueOnce()
            jest.spyOn(documentsServiceMock, 'expireDocument').mockResolvedValueOnce()

            expect(await officeIdentifierRemovedEventListener.handler(message)).toBeUndefined()

            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(itn)
            expect(userProfileServiceMock.removeProfileFeature).toHaveBeenCalledWith(identifier, ProfileFeature.office)
            expect(documentsServiceMock.expireDocument).toHaveBeenCalledWith(identifier, 'official-certificate')
        })
    })
})
