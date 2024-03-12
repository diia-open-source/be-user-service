import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetServiceUserByLoginAction from '@actions/v1/userInfo/getServiceUserByLogin'

import ServiceUserService from '@services/serviceUser'

import { ServiceUserModel } from '@interfaces/models/serviceUser'

describe(`Action ${GetServiceUserByLoginAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const serviceUserServiceMock = mockInstance(ServiceUserService)

    const getServiceUserByLoginAction = new GetServiceUserByLoginAction(serviceUserServiceMock)

    describe('method `handler`', () => {
        it('should return nonce', async () => {
            const args = {
                params: { login: 'login', hashedPassword: 'hashedPassword' },
                session: testKit.session.getUserSession(),
                headers,
            }

            const userModel = { login: 'login', hashedPassword: 'hashedPassword', twoFactorSecret: 'twoFactorSecret' }

            jest.spyOn(serviceUserServiceMock, 'getServiceUserByLogin').mockResolvedValueOnce(<ServiceUserModel>userModel)

            expect(await getServiceUserByLoginAction.handler(args)).toMatchObject(userModel)

            expect(serviceUserServiceMock.getServiceUserByLogin).toHaveBeenCalledWith(args.params.login)
        })
    })
})
