import { AccessDeniedError } from '@diia-inhouse/errors'

const serviceUserModelMock = {
    findOne: jest.fn(),
    modelName: 'ServiceUser',
}

jest.mock('@models/serviceUser', () => serviceUserModelMock)

import ServiceUserService from '@services/serviceUser'

describe(`Service ${ServiceUserService.name}`, () => {
    const serviceUserService = new ServiceUserService()

    describe('method: `getServiceUserByLogin`', () => {
        it('should throw AccessDeniedError if user not found', async () => {
            const login = 'login'
            const undefinedValue = undefined

            jest.spyOn(serviceUserModelMock, 'findOne').mockResolvedValueOnce(undefinedValue)

            await expect(serviceUserService.getServiceUserByLogin(login)).rejects.toEqual(new AccessDeniedError('ServiceUser not found'))
        })

        it('should return service user', async () => {
            const login = 'login'
            const serviceUser = {
                login,
                hashedPassword: 'hashedPassword',
                twoFactorSecret: 'twoFactorSecret',
            }

            jest.spyOn(serviceUserModelMock, 'findOne').mockResolvedValueOnce(serviceUser)

            expect(await serviceUserService.getServiceUserByLogin(login)).toMatchObject(serviceUser)
        })
    })
})
