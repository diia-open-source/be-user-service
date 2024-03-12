import { GrpcClientFactory } from '@diia-inhouse/diia-app'

import { CryptoDocServiceDefinition } from '@diia-inhouse/diia-crypto-client'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { MetricsService } from '@diia-inhouse/diia-metrics'
import { mockInstance } from '@diia-inhouse/test'

import { GrpcServiceName } from '@interfaces/application'

const grpcClientFactory = new GrpcClientFactory('User', new DiiaLogger(), mockInstance(MetricsService))

export const cryptoDocServiceClient = grpcClientFactory.createGrpcClient(CryptoDocServiceDefinition, 'test', GrpcServiceName.Crypto)
