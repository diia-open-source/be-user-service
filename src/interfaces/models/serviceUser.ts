import { Document } from '@diia-inhouse/db'

export interface ServiceUser {
    login: string
    hashedPassword?: string
    twoFactorSecret?: string
}

export interface ServiceUserModel extends ServiceUser, Document {}
