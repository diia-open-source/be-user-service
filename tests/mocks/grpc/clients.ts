import { GrpcClientFactory } from '@diia-inhouse/diia-app'

import { CryptoDocServiceDefinition } from '@diia-inhouse/diia-crypto-client'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { MetricsService } from '@diia-inhouse/diia-metrics'
import { DocumentsServiceDefinition } from '@diia-inhouse/documents-service-client'
import { mockInstance } from '@diia-inhouse/test'
import { SessionType } from '@diia-inhouse/types'

const grpcClientFactory = new GrpcClientFactory('User', new DiiaLogger(), mockInstance(MetricsService))

export const cryptoDocServiceClient = grpcClientFactory.createGrpcClient(CryptoDocServiceDefinition, 'test')

export const documentsDocServiceClient = grpcClientFactory.createGrpcClient(DocumentsServiceDefinition, 'test')

jest.spyOn(documentsDocServiceClient, 'getSortedByDefaultDocumentTypes').mockResolvedValue({
    sortedDocumentTypes: { [SessionType.User]: { items: ['birth-record'] }, [SessionType.EResident]: { items: [] } },
})

jest.spyOn(documentsDocServiceClient, 'getDocumentNames').mockResolvedValue({
    documentTypeToName: {},
})

jest.spyOn(documentsDocServiceClient, 'getDocumentTypes').mockResolvedValue({
    documentTypes: [],
})
