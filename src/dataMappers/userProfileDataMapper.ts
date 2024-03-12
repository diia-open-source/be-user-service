import { UserTokenData } from '@diia-inhouse/types'

import { AuthProviderName } from '@interfaces/services/auth'

export default class UserProfileDataMapper {
    getUserInfoText(user: UserTokenData): string {
        const {
            phoneNumber,
            email,
            authEntryPoint: { isBankId, target },
        } = user

        if (!phoneNumber && !email) {
            return 'Будь ласка, заповніть контактні дані.'
        }

        if (isBankId) {
            return 'Ми заповнили дані з вашого BankID. Будь ласка, перевірте їх та змініть за потреби.'
        }

        if ([AuthProviderName.PrivatBank, AuthProviderName.Monobank].includes(<AuthProviderName>target)) {
            return 'Ми отримали дані від вашого банку. Будь ласка, перевірте їх та змініть за потреби.'
        }

        return 'Будь ласка, заповніть контактні дані.'
    }
}
