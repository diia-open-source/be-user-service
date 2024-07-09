import { randomUUID } from 'node:crypto'

import { mockInstance } from '@diia-inhouse/test'

import OfficeIdentifierTokenFailEventListener from '@src/externalEventListeners/officeIdentifierTokenFail'

import UserProfileService from '@services/userProfile'

describe('OfficeIdentifierTokenFailEventListener', () => {
    const userProfileServiceMock = mockInstance(UserProfileService)
    const officeIdentifierTokenFailEventListener = new OfficeIdentifierTokenFailEventListener(userProfileServiceMock)

    describe('method: `handler`', () => {
        it('should succeed', async () => {
            const message = {
                uuid: randomUUID(),
                request: {
                    profileId: randomUUID(),
                    reason: 'Office token failed',
                },
            }
            const {
                request: { profileId, reason },
            } = message

            jest.spyOn(userProfileServiceMock, 'officeTokenFailed').mockResolvedValueOnce()

            expect(await officeIdentifierTokenFailEventListener.handler(message)).toBeUndefined()

            expect(userProfileServiceMock.officeTokenFailed).toHaveBeenCalledWith(profileId, reason)
        })
    })
})
