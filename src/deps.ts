import { AwilixContainer, Constructor, Lifetime, asClass, asFunction, asValue } from 'awilix'
import { once } from 'lodash'

import { DepsFactoryFn, DepsResolver, GrpcClientFactory, GrpcService } from '@diia-inhouse/diia-app'

import { AuthServiceDefinition } from '@diia-inhouse/auth-service-client'
import { AuthService, CryptoDeps, CryptoService, HashService, IdentifierService } from '@diia-inhouse/crypto'
import { DatabaseService, DbType } from '@diia-inhouse/db'
import { CryptoDocServiceDefinition } from '@diia-inhouse/diia-crypto-client'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { HealthCheck } from '@diia-inhouse/healthcheck'
import { HttpDeps, HttpService } from '@diia-inhouse/http'
import { I18nService } from '@diia-inhouse/i18n'
import { NotificationServiceDefinition } from '@diia-inhouse/notification-service-client'
import { HttpProtocol } from '@diia-inhouse/types'

import UbchMockProvider from '@providers/creditHistory/mock'
import UbchProvider from '@providers/creditHistory/ubch'

import { AppDeps, GrpcClientsDeps, GrpcServiceName, InternalDeps } from '@interfaces/application'
import { AppConfig } from '@interfaces/config'
import { CreditHistoryProvider } from '@interfaces/providers/creditHistory'

export default (config: AppConfig): ReturnType<DepsFactoryFn<AppConfig, AppDeps>> => {
    const { db, healthCheck, auth, identifier, ubch } = config

    const ubchProvider: Constructor<CreditHistoryProvider> = ubch.isEnabled ? UbchProvider : UbchMockProvider
    const internalDeps: DepsResolver<InternalDeps> = {
        lazyUserDocumentService: {
            resolve: (c: AwilixContainer) => once(() => c.resolve('userDocumentService')),
            lifetime: Lifetime.SINGLETON,
        },
        creditHistoryProvider: asClass(ubchProvider).singleton(),
        ubchProvider: asClass(UbchProvider).singleton(),
    }

    const cryptoDeps: DepsResolver<CryptoDeps> = {
        auth: asClass(AuthService, { injector: () => ({ authConfig: auth }) }).singleton(),
        identifier: asClass(IdentifierService, { injector: () => ({ identifierConfig: identifier }) }).singleton(),
        crypto: asClass(CryptoService).singleton(),
        hash: asClass(HashService).singleton(),
    }

    const httpDeps: DepsResolver<HttpDeps> = {
        httpService: asClass(HttpService, { injector: () => ({ protocol: HttpProtocol.Http }) }).singleton(),
        httpsService: asClass(HttpService, { injector: () => ({ protocol: HttpProtocol.Https }) }).singleton(),
    }

    const grpcClientsDeps: DepsResolver<GrpcClientsDeps> = {
        authServiceClient: asFunction((grpcClientFactory: GrpcClientFactory) =>
            grpcClientFactory.createGrpcClient(AuthServiceDefinition, config.grpc.authServiceAddress, GrpcServiceName.Auth),
        ).singleton(),
        notificationServiceClient: asFunction((grpcClientFactory: GrpcClientFactory) =>
            grpcClientFactory.createGrpcClient(
                NotificationServiceDefinition,
                config.grpc.notificationServiceAddress,
                GrpcServiceName.Notification,
            ),
        ).singleton(),
        cryptoDocServiceClient: asFunction((grpcClientFactory: GrpcClientFactory) =>
            grpcClientFactory.createGrpcClient(CryptoDocServiceDefinition, config.grpc.cryptoDocServiceAddress, GrpcServiceName.Crypto),
        ).singleton(),
    }

    return {
        config: asValue(config),
        logger: asClass(DiiaLogger, { injector: () => ({ options: { logLevel: process.env.LOG_LEVEL } }) }).singleton(),
        healthCheck: asClass(HealthCheck, { injector: (c) => ({ container: c.cradle, healthCheckConfig: healthCheck }) }).singleton(),
        database: asClass(DatabaseService, { injector: () => ({ dbConfigs: { [DbType.Main]: db } }) }).singleton(),
        i18n: asClass(I18nService).singleton(),
        grpcService: asClass(GrpcService, { injector: (c) => ({ container: c }) }).singleton(),

        ...grpcClientsDeps,
        ...internalDeps,
        ...cryptoDeps,
        ...httpDeps,
    }
}
