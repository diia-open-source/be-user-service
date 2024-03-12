import TestKit from '@diia-inhouse/test'
import { UserTokenData } from '@diia-inhouse/types'

import UserProfileDataMapper from '@dataMappers/userProfileDataMapper'

import { AuthProviderName } from '@interfaces/services/auth'

describe('UserProfileDataMapper', () => {
    const testKit = new TestKit()

    describe('method: `getUserInfoText`', () => {
        const { user } = testKit.session.getUserSession()
        const { phoneNumber, email, ...userWithoutContactData } = user
        const userProfileDataMapper = new UserProfileDataMapper()

        it.each([
            ['Будь ласка, заповніть контактні дані.', userWithoutContactData],
            [
                'Ми заповнили дані з вашого BankID. Будь ласка, перевірте їх та змініть за потреби.',
                { ...user, authEntryPoint: { isBankId: true } },
            ],
            [
                'Ми отримали дані від вашого банку. Будь ласка, перевірте їх та змініть за потреби.',
                { ...user, authEntryPoint: { isBankId: false, target: AuthProviderName.PrivatBank } },
            ],
            ['Будь ласка, заповніть контактні дані.', { ...user, authEntryPoint: { isBankId: false, target: 'target' } }],
        ])('should return text: %s', (expectedResult, inputUser) => {
            expect(userProfileDataMapper.getUserInfoText(<UserTokenData>inputUser)).toBe(expectedResult)
        })
    })
})
