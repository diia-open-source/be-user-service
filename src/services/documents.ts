import ExpiryMap from 'expiry-map'
import type { default as PMemoize } from 'p-memoize' with { 'resolution-mode': 'require' }

import { MoleculerService } from '@diia-inhouse/diia-app'

import { DocumentsServiceClient } from '@diia-inhouse/documents-service-client'
import { ActionVersion, AppUser, SessionType, UserTokenData } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import { AppConfig } from '@interfaces/config'
import { IdentityDocument, Passport } from '@interfaces/services/documents'

export default class DocumentsService {
    private readonly serviceName = 'Documents'

    private readonly memoizedGetDocumentNames: DocumentsServiceClient['getDocumentNames']

    private readonly memoizedGetSortedByDefaultDocumentTypes: DocumentsServiceClient['getSortedByDefaultDocumentTypes']

    constructor(
        private readonly config: AppConfig,
        private readonly moleculer: MoleculerService,
        private readonly documentsServiceClient: DocumentsServiceClient,
        private readonly pMemoize: typeof PMemoize,
    ) {
        this.memoizedGetDocumentNames = this.pMemoize(this.documentsServiceClient.getDocumentNames.bind(this.documentsServiceClient), {
            cache: new ExpiryMap(this.config.documents.memoizeCacheTtl),
        })
        this.memoizedGetSortedByDefaultDocumentTypes = this.pMemoize(
            this.documentsServiceClient.getSortedByDefaultDocumentTypes.bind(this.documentsServiceClient),
            { cache: new ExpiryMap(this.config.documents.memoizeCacheTtl) },
        )
    }

    async getDocumentNames(docTypes: string[]): Promise<string[]> {
        const { documentTypeToName } = await this.memoizedGetDocumentNames({})

        return docTypes.map((docType) => documentTypeToName[docType])
    }

    async getSortedByDefaultDocumentTypes(): ReturnType<DocumentsServiceClient['getSortedByDefaultDocumentTypes']> {
        return await this.memoizedGetSortedByDefaultDocumentTypes({})
    }

    async getPassportToProcess(user: UserTokenData): Promise<Passport> {
        return await this.moleculer.act(
            this.serviceName,
            {
                name: 'getPassportToProcess',
                actionVersion: ActionVersion.V1,
            },
            {
                session: { sessionType: SessionType.User, user },
            },
        )
    }

    async getIdentityDocument(user: AppUser): Promise<IdentityDocument> {
        return await this.moleculer.act(
            this.serviceName,
            {
                name: 'getIdentityDocument',
                actionVersion: ActionVersion.V1,
            },
            {
                session: utils.makeSession(user),
            },
        )
    }

    async expireDocument(userIdentifier: string, documentType: string): Promise<void> {
        return await this.moleculer.act(
            this.serviceName,
            { name: 'expireDocument', actionVersion: ActionVersion.V2 },
            { params: { userIdentifier, documentType } },
        )
    }
}
