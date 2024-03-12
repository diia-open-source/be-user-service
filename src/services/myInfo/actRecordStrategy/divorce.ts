import { DocumentTypeCamelCase, ListItemMlc, UserTokenData } from '@diia-inhouse/types'

import { ActRecordsData, DocumentItem } from '@src/generated'

import DocumentsService from '@services/documents'

import MyInfoDataMapper from '@dataMappers/myInfoDataMapper'

import { ActRecordStrategy } from '@interfaces/services/myInfo/actRecordStrategy'

export default class Divorce implements ActRecordStrategy {
    private readonly documentType = DocumentTypeCamelCase.divorceActRecord

    constructor(
        private readonly documentsService: DocumentsService,
        private readonly myInfoDataMapper: MyInfoDataMapper,
    ) {}

    toActRecordsPreviewItem(documentsResponse: DocumentItem): ListItemMlc[] {
        return documentsResponse.data.map((itm) => this.myInfoDataMapper.toPartnerItem(itm))
    }

    toActRecordsData(documentsResponse: DocumentItem): ActRecordsData {
        return {
            divorceRecord: documentsResponse,
        }
    }

    async getActRecords(user: UserTokenData, eTag?: string): Promise<DocumentItem | undefined> {
        const { [this.documentType]: documentsResponse } = await this.documentsService.getDesignSystemDocumentsToProcess(user, {
            documents: [{ type: this.documentType, eTag }],
        })

        return documentsResponse
    }
}
