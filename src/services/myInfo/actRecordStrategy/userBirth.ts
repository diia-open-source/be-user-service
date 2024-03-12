import { DocumentTypeCamelCase, ListItemMlc, UserTokenData } from '@diia-inhouse/types'

import { ActRecordsData, DocumentItem } from '@src/generated'

import DocumentsService from '@services/documents'

import { ActRecordStrategy } from '@interfaces/services/myInfo/actRecordStrategy'

export default class UserBirth implements ActRecordStrategy {
    private readonly documentType = DocumentTypeCamelCase.userBirthCertificate

    constructor(private readonly documentsService: DocumentsService) {}

    toActRecordsPreviewItem(): ListItemMlc[] {
        throw new Error('Method not implemented.')
    }

    toActRecordsData(): ActRecordsData {
        throw new Error('Method not implemented.')
    }

    async getActRecords(user: UserTokenData, eTag?: string): Promise<DocumentItem | undefined> {
        const { [this.documentType]: documentsResponse } = await this.documentsService.getDesignSystemDocumentsToProcess(user, {
            documents: [{ type: this.documentType, eTag }],
        })

        return documentsResponse
    }
}
