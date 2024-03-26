import { randomUUID as uuid } from 'node:crypto'

import { IdentifierService } from '@diia-inhouse/crypto'
import { ActionVersion, AppUserActionHeaders, AuthDocumentType, Gender, PlatformType, SessionType, UserSession } from '@diia-inhouse/types'

import { RandomData } from './randomData'

export default class SessionGenerator {
    private readonly randomData: RandomData

    constructor(private readonly identifier: IdentifierService) {
        this.randomData = new RandomData(this.identifier)
    }

    getUserSession(): UserSession {
        const itn: string = this.randomData.generateItn()

        return {
            sessionType: SessionType.User,
            user: {
                fName: 'Дія',
                lName: 'Надія',
                mName: 'Володимирівна',
                itn,
                gender: Gender.female,
                phoneNumber: '+380999999999',
                email: 'test@test.com',
                mobileUid: uuid(),
                passport: '12345',
                document: { type: AuthDocumentType.ForeignPassport, value: '12345' },
                birthDay: '01.09.2019',
                addressOfRegistration: '',
                addressOfBirth: '',
                sessionType: SessionType.User,
                identifier: this.identifier.createIdentifier(itn),
                authEntryPoint: {
                    target: 'bankid',
                    isBankId: true,
                    bankName: 'diia bank',
                    document: AuthDocumentType.ForeignPassport,
                },
                refreshToken: {
                    value: uuid(),
                    expirationTime: Date.now() + 300000,
                },
            },
        }
    }

    getHeaders(actionVersion = ActionVersion.V0): AppUserActionHeaders {
        return {
            actionVersion,
            traceId: uuid(),
            mobileUid: uuid(),
            platformType: PlatformType.Android,
            platformVersion: '14.1.20',
            appVersion: '10.0.0',
        }
    }
}
