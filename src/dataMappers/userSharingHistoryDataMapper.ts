import moment from 'moment'

import { ButtonState, CardMlc, DocumentType, TextLabelMlc } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'

import { UserSharingHistoryItemModel } from '@interfaces/models/userSharingHistoryItem'
import { HistoryItem, HistoryItemResponse, UserHistoryCode } from '@interfaces/services/userHistory'

export default class UserSharingHistoryDataMapper {
    constructor(private readonly userHistoryDataMapper: UserHistoryDataMapper) {}

    toEntity(model: UserSharingHistoryItemModel): HistoryItem {
        const {
            sharingId,
            acquirer: { name: acquirerName, address },
            date,
            documents,
            offer,
        } = model

        return {
            id: sharingId,
            status: this.userHistoryDataMapper.getStatus(model),
            date: moment(date).format(this.userHistoryDataMapper.dateFormatV1),
            documents: documents.map((docType: DocumentType) => this.userHistoryDataMapper.getDocumentName(docType)),
            recipient: { name: acquirerName, address },
            purpose: offer?.name,
        }
    }

    toHistoryItemEntity(model: UserSharingHistoryItemModel, action: UserHistoryCode): CardMlc {
        const { sharingId, acquirer, date } = model

        const status = this.userHistoryDataMapper.getStatus(model)

        return {
            id: sharingId,
            chipStatusAtm: {
                code: status,
                name: this.userHistoryDataMapper.getHistoryItemStatusNameByActionAndStatus(action, status),
                type: this.userHistoryDataMapper.getHistoryStatusChipTypeByStatus(status),
            },
            title: acquirer.name,
            description: acquirer.address,
            botLabel: utils.formatDate(date, this.userHistoryDataMapper.dateFormat),
            btnPrimaryAdditionalAtm: {
                label: 'Детальніше',
                state: ButtonState.enabled,
                action: {
                    type: 'historyItemsStatus',
                },
            },
        }
    }

    getHistoryItem(model: UserSharingHistoryItemModel, action: UserHistoryCode): HistoryItemResponse['body'] {
        const { acquirer, date, documents, offer } = model

        const status = this.userHistoryDataMapper.getStatus(model)

        const documentsNames = documents.map((docType: DocumentType) => this.userHistoryDataMapper.getDocumentName(docType))

        return [
            {
                titleLabelMlc: {
                    label: this.userHistoryDataMapper.getHistoryItemTitleByAction(action),
                },
            },
            {
                statusMessageMlc: {
                    icon: this.userHistoryDataMapper.getHistoryItemStatusMessageIconByStatus(status),
                    title: this.userHistoryDataMapper.getHistoryItemStatusNameByActionAndStatus(action, status),
                    text: utils.formatDate(date, this.userHistoryDataMapper.dateFormat),
                    parameters: [],
                },
            },
            {
                subtitleLabelMlc: {
                    label: acquirer.name,
                },
            },
            { textLabelMlc: this.getHistoryItemTextLabelMlcByAction(acquirer.address, offer?.name || '', documentsNames) },
        ]
    }

    getHistoryItemTextLabelMlcByAction(address: string, purpose: string, documents: string[]): TextLabelMlc {
        return {
            text: `${address}. \n\n${purpose}. \n\nЗапитано копії наступних документів:\n• ${documents.join('\n• ')}`,
            parameters: [],
        }
    }
}
