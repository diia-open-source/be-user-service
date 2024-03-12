const momentStub = jest.fn()

jest.mock('moment', () => momentStub)

import TestKit, { mockInstance } from '@diia-inhouse/test'

import AuthCreateOrUpdateEResidentProfileEventListener from '@src/eventListeners/authCreateOrUpdateEResidentProfile'

import EResidentProfileService from '@services/eResidentProfile'

import { EventPayload } from '@interfaces/eventListeners/authCreateOrUpdateEResidentProfile'

describe('AuthCreateOrUpdateEResidentProfileEventListener', () => {
    const testKit = new TestKit()
    const eResidentProfileServiceMock = mockInstance(EResidentProfileService)
    const authCreateOrUpdateEResidentProfileEventListener = new AuthCreateOrUpdateEResidentProfileEventListener(eResidentProfileServiceMock)

    beforeAll(() => {
        jest.useFakeTimers()
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    describe('method: `verify`', () => {
        it('should succeed', async () => {
            const {
                user: { birthDay, gender, identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const headers = testKit.session.getUserSession()
            const message = {
                birthDay,
                gender,
                userIdentifier,
                headers,
            }
            const dateOfBirth = new Date()

            jest.spyOn(eResidentProfileServiceMock, 'createOrUpdateProfile').mockResolvedValueOnce()
            momentStub.mockReturnValueOnce({ valueOf: () => dateOfBirth.getTime() })

            expect(await authCreateOrUpdateEResidentProfileEventListener.handler(<EventPayload>(<unknown>message))).toBeUndefined()

            expect(momentStub).toHaveBeenCalledWith(birthDay, 'DD.MM.YYYY')
            expect(eResidentProfileServiceMock.createOrUpdateProfile).toHaveBeenCalledWith(
                { identifier: userIdentifier, gender, birthDay: dateOfBirth },
                headers,
            )
        })
    })
})
