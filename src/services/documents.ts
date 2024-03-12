import { MoleculerService } from '@diia-inhouse/diia-app'

import { ActionVersion, AppUser, DocumentType, SessionType, UserTokenData } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import { DocumentsResponse, GetDocumentsRequest, IdentityDocument, Passport } from '@interfaces/services/documents'

export default class DocumentsService {
    private readonly serviceName = 'Documents'

    constructor(private readonly moleculer: MoleculerService) {}

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

    async expireDocument(userIdentifier: string, documentType: DocumentType): Promise<void> {
        return await this.moleculer.act(
            this.serviceName,
            { name: 'expireDocument', actionVersion: ActionVersion.V2 },
            { params: { userIdentifier, documentType } },
        )
    }

    async getDesignSystemDocumentsToProcess(user: UserTokenData, request: GetDocumentsRequest): Promise<DocumentsResponse> {
        return await this.moleculer.act(
            this.serviceName,
            {
                name: 'getDesignSystemDocumentsToProcess',
                actionVersion: ActionVersion.V1,
            },
            {
                params: request,
                session: utils.makeSession(user),
            },
        )
    }
}
