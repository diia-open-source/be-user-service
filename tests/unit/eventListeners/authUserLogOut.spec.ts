import { randomUUID } from 'crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'

import AuthUserLogOutEventListener from '@src/eventListeners/authUserLogOut'

import DiiaIdService from '@services/diiaId'
import UserDeviceService from '@services/userDevice'
import UserDocumentService from '@services/userDocument'
import UserDocumentStorageService from '@services/userDocumentStorage'

describe('AuthUserLogOutEventListener', () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)
    const userDeviceServiceMock = mockInstance(UserDeviceService)
    const userDocumentServiceMock = mockInstance(UserDocumentService)
    const userDocumentStorageServiceMock = mockInstance(UserDocumentStorageService)
    const authUserLogOutEventListener = new AuthUserLogOutEventListener(
        diiaIdServiceMock,
        userDeviceServiceMock,
        userDocumentServiceMock,
        userDocumentStorageServiceMock,
    )

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const mobileUid = randomUUID()
            const message = {
                userIdentifier,
                mobileUid,
            }

            jest.spyOn(userDeviceServiceMock, 'unassignDevice').mockResolvedValueOnce()
            jest.spyOn(diiaIdServiceMock, 'softDeleteIdentifiers').mockResolvedValueOnce(true)
            jest.spyOn(userDocumentStorageServiceMock, 'removeCovidCertificatesFromStorage').mockResolvedValueOnce()
            jest.spyOn(userDocumentServiceMock, 'removeDeviceDocuments').mockResolvedValueOnce()

            expect(await authUserLogOutEventListener.handler(message)).toBeUndefined()

            expect(userDeviceServiceMock.unassignDevice).toHaveBeenCalledWith(mobileUid, userIdentifier)
            expect(diiaIdServiceMock.softDeleteIdentifiers).toHaveBeenCalledWith(userIdentifier, { mobileUid })
            expect(userDocumentStorageServiceMock.removeCovidCertificatesFromStorage).toHaveBeenCalledWith(userIdentifier, mobileUid)
            expect(userDocumentServiceMock.removeDeviceDocuments).toHaveBeenCalledWith(userIdentifier, mobileUid)
        })
    })
})
