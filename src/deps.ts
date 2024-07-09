import { once } from 'lodash'

import {
    AwilixContainer,
    BaseDeps,
    Constructor,
    DepsFactoryFn,
    GrpcClientFactory,
    Lifetime,
    NameAndRegistrationPair,
    asClass,
    asFunction,
    asValue,
} from '@diia-inhouse/diia-app'

import { AuthServiceDefinition } from '@diia-inhouse/auth-service-client'
import { CryptoService, HashService } from '@diia-inhouse/crypto'
import { CryptoDocServiceDefinition } from '@diia-inhouse/diia-crypto-client'
import { DocumentsServiceDefinition } from '@diia-inhouse/documents-service-client'
import { HttpService } from '@diia-inhouse/http'
import { I18nService } from '@diia-inhouse/i18n'
import { NotificationServiceDefinition } from '@diia-inhouse/notification-service-client'
import { HttpProtocol } from '@diia-inhouse/types'

import UbchMockProvider from '@providers/creditHistory/mock'
import UbchProvider from '@providers/creditHistory/ubch'

import { AppDeps, GrpcClientsDeps, InternalDeps } from '@interfaces/application'
import { AppConfig } from '@interfaces/config'
import { CreditHistoryProvider } from '@interfaces/providers/creditHistory'

export default async (config: AppConfig, baseContainer: AwilixContainer<BaseDeps>): ReturnType<DepsFactoryFn<AppConfig, AppDeps>> => {
    const {
        ubch,
        documents: { types: documentTypesConfig },
        grpc: { documentsServiceAddress, authServiceAddress, cryptoDocServiceAddress, notificationServiceAddress },
    } = config
    const documentsServiceClient = baseContainer
        .resolve('grpcClientFactory')
        .createGrpcClient(DocumentsServiceDefinition, documentsServiceAddress)
    const { documentTypes } = documentTypesConfig
        ? { documentTypes: documentTypesConfig }
        : await documentsServiceClient.getDocumentTypes({})

    const ubchProvider: Constructor<CreditHistoryProvider> = ubch.isEnabled ? UbchProvider : UbchMockProvider
    const internalDeps: NameAndRegistrationPair<InternalDeps> = {
        lazyUserDocumentService: {
            resolve: (c: AwilixContainer) => once(() => c.resolve('userDocumentService')),
            lifetime: Lifetime.SINGLETON,
        },
        creditHistoryProvider: asClass(ubchProvider).singleton(),
        ubchProvider: asClass(UbchProvider).singleton(),
        documentTypes: asValue(documentTypes),
    }

    const grpcClientsDeps: NameAndRegistrationPair<GrpcClientsDeps> = {
        authServiceClient: asFunction((grpcClientFactory: GrpcClientFactory) =>
            grpcClientFactory.createGrpcClient(AuthServiceDefinition, authServiceAddress),
        ).singleton(),
        notificationServiceClient: asFunction((grpcClientFactory: GrpcClientFactory) =>
            grpcClientFactory.createGrpcClient(NotificationServiceDefinition, notificationServiceAddress),
        ).singleton(),
        cryptoDocServiceClient: asFunction((grpcClientFactory: GrpcClientFactory) =>
            grpcClientFactory.createGrpcClient(CryptoDocServiceDefinition, cryptoDocServiceAddress),
        ).singleton(),
        documentsServiceClient: asValue(documentsServiceClient),
    }
    const { default: pMemoize } = await import('p-memoize')

    return {
        i18n: asClass(I18nService).singleton(),
        hash: asClass(HashService).singleton(),
        crypto: asClass(CryptoService).singleton(),
        httpService: asClass(HttpService, { injector: () => ({ protocol: HttpProtocol.Http }) }).singleton(),
        httpsService: asClass(HttpService, { injector: () => ({ protocol: HttpProtocol.Https }) }).singleton(),
        pMemoize: asValue(pMemoize),

        ...grpcClientsDeps,
        ...internalDeps,
    }
}
