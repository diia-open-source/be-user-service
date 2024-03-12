import { GrpcService } from '@diia-inhouse/diia-app'

import { AuthServiceClient } from '@diia-inhouse/auth-service-client'
import { CryptoDeps } from '@diia-inhouse/crypto'
import { DatabaseService } from '@diia-inhouse/db'
import { CryptoDocServiceClient } from '@diia-inhouse/diia-crypto-client'
import { QueueDeps } from '@diia-inhouse/diia-queue'
import { HealthCheck } from '@diia-inhouse/healthcheck'
import { HttpDeps } from '@diia-inhouse/http'
import { I18nService } from '@diia-inhouse/i18n'
import { NotificationServiceClient } from '@diia-inhouse/notification-service-client'
import { RedisDeps } from '@diia-inhouse/redis'

import UserDocumentService from '@services/userDocument'

import UbchProvider from '@providers/creditHistory/ubch'

import { AppConfig } from '@interfaces/config'
import { CreditHistoryProvider } from '@interfaces/providers/creditHistory'

export type InternalDeps = {
    lazyUserDocumentService: () => UserDocumentService
    creditHistoryProvider: CreditHistoryProvider
    ubchProvider: UbchProvider
}

export interface GrpcClientsDeps {
    authServiceClient: AuthServiceClient
    notificationServiceClient: NotificationServiceClient
    cryptoDocServiceClient: CryptoDocServiceClient
}

export type AppDeps = {
    config: AppConfig
    healthCheck: HealthCheck
    database: DatabaseService
    i18n: I18nService
    grpcService: GrpcService
} & Partial<QueueDeps> &
    Partial<RedisDeps> &
    CryptoDeps &
    HttpDeps &
    GrpcClientsDeps

export enum GrpcServiceName {
    Auth = 'Auth',
    Crypto = 'Crypto',
    Notification = 'Notification',
}
