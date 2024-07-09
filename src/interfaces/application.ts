import type { default as PMemoize } from 'p-memoize' with { 'resolution-mode': 'require' }

import { AuthServiceClient } from '@diia-inhouse/auth-service-client'
import { CryptoDeps } from '@diia-inhouse/crypto'
import { CryptoDocServiceClient } from '@diia-inhouse/diia-crypto-client'
import { DocumentsServiceClient } from '@diia-inhouse/documents-service-client'
import { HttpDeps } from '@diia-inhouse/http'
import { I18nService } from '@diia-inhouse/i18n'
import { NotificationServiceClient } from '@diia-inhouse/notification-service-client'

import UserDocumentService from '@services/userDocument'

import UbchProvider from '@providers/creditHistory/ubch'

import { AppConfig } from '@interfaces/config'
import { CreditHistoryProvider } from '@interfaces/providers/creditHistory'

export type InternalDeps = {
    lazyUserDocumentService: () => UserDocumentService
    creditHistoryProvider: CreditHistoryProvider
    ubchProvider: UbchProvider
    documentTypes: string[]
}

export interface GrpcClientsDeps {
    authServiceClient: AuthServiceClient
    notificationServiceClient: NotificationServiceClient
    cryptoDocServiceClient: CryptoDocServiceClient
    documentsServiceClient: DocumentsServiceClient
}

export type AppDeps = {
    config: AppConfig
    i18n: I18nService
    hash: CryptoDeps['hash']
    crypto: CryptoDeps['crypto']
    pMemoize: typeof PMemoize
} & HttpDeps &
    GrpcClientsDeps
