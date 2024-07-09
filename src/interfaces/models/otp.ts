import { Document } from '@diia-inhouse/db'

export interface Otp {
    value: number
    expirationDate: Date
    userIdentifier: string
    mobileUid: string
    isDeleted: boolean
    usedDate?: Date
    verifyAttempt: number
}

export interface OtpModel extends Otp, Document {}
