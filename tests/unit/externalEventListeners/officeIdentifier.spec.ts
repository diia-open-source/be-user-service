import { randomUUID } from 'node:crypto'

import { IdentifierService } from '@diia-inhouse/crypto'
import DiiaLogger from '@diia-inhouse/diia-logger'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DiiaOfficeStatus, HttpStatusCode, ProfileFeature } from '@diia-inhouse/types'

import OfficeIdentifierEventListener from '@src/externalEventListeners/officeIdentifier'

import DocumentsService from '@services/documents'
import UserProfileService from '@services/userProfile'

import { DiiaOfficeProfile } from '@interfaces/models/userProfile'
import { ExternalEvent } from '@interfaces/queue'

describe('OfficeIdentifierEventListener', () => {
    const testKit = new TestKit()
    const userProfileServiceMock = mockInstance(UserProfileService)
    const identifierServiceMock = mockInstance(IdentifierService)
    const loggerMock = mockInstance(DiiaLogger)
    const documentsServiceMock = mockInstance(DocumentsService)
    const officeIdentifierEventListener = new OfficeIdentifierEventListener(
        userProfileServiceMock,
        identifierServiceMock,
        loggerMock,
        documentsServiceMock,
    )

    describe('method: `handler`', () => {
        it('should successfully set profile feature and expire document', async () => {
            const {
                user: { identifier, itn },
            } = testKit.session.getUserSession()
            const message = {
                uuid: randomUUID(),
                response: {
                    rnokpp: itn,
                    profile: <Omit<DiiaOfficeProfile, 'status'>>{},
                    status: DiiaOfficeStatus.DISMISSED,
                },
            }
            const {
                response: { status, profile },
            } = message

            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(identifier)
            jest.spyOn(userProfileServiceMock, 'setProfileFeature').mockResolvedValueOnce()
            jest.spyOn(documentsServiceMock, 'expireDocument').mockResolvedValueOnce()

            expect(await officeIdentifierEventListener.handler(message)).toBeUndefined()

            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(itn)
            expect(userProfileServiceMock.setProfileFeature).toHaveBeenCalledWith(identifier, ProfileFeature.office, { ...profile, status })
            expect(documentsServiceMock.expireDocument).toHaveBeenCalledWith(identifier, 'official-certificate')
        })

        it('should just log error in case it is received', async () => {
            const {
                user: { itn },
            } = testKit.session.getUserSession()
            const message = {
                uuid: randomUUID(),
                error: {
                    message: 'Unable to set profile feature',
                    http_code: HttpStatusCode.BAD_REQUEST,
                },
                response: {
                    rnokpp: itn,
                    profile: <Omit<DiiaOfficeProfile, 'status'>>{},
                    status: DiiaOfficeStatus.ACTIVE,
                },
            }
            const { error } = message

            expect(await officeIdentifierEventListener.handler(message)).toBeUndefined()

            expect(loggerMock.fatal).toHaveBeenCalledWith(`Received error response on ${ExternalEvent.OfficeIdentifier}`, { error })
        })
    })
})
