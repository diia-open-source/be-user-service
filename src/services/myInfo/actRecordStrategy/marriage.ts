import { DocumentTypeCamelCase, ListItemMlc, UserTokenData } from '@diia-inhouse/types'

import { ActRecordsData, DocumentItem } from '@src/generated'

import DocumentsService from '@services/documents'

import MyInfoDataMapper from '@dataMappers/myInfoDataMapper'

import { ActRecordStrategy } from '@interfaces/services/myInfo/actRecordStrategy'

export default class Marriage implements ActRecordStrategy {
    private readonly documentType = DocumentTypeCamelCase.marriageActRecord

    constructor(
        private readonly documentsService: DocumentsService,
        private readonly myInfoDataMapper: MyInfoDataMapper,
    ) {}

    toActRecordsPreviewItem(documentsResponse: DocumentItem): ListItemMlc[] {
        return documentsResponse.data.map((itm) => this.myInfoDataMapper.toPartnerItem(itm))
    }

    toActRecordsData(documentsResponse: DocumentItem): ActRecordsData {
        return {
            marriageRecord: documentsResponse,
        }
    }

    async getActRecords(user: UserTokenData, eTag?: string): Promise<DocumentItem | undefined> {
        const { [this.documentType]: documentsResponse } = await this.documentsService.getDesignSystemDocumentsToProcess(user, {
            documents: [{ type: this.documentType, eTag }],
        })

        return documentsResponse
    }
}
