import moment from 'moment'

import { UnprocessableEntityError } from '@diia-inhouse/errors'
import { ButtonState, CardMlc, TextLabelMlc } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'

import { UserSigningHistoryItemModel } from '@interfaces/models/userSigningHistoryItem'
import {
    GetHistoryItemBodyPayload,
    HistoryActionRecipient,
    HistoryItem,
    HistoryItemByCode,
    HistoryItemResponse,
    SigningHistoryItem,
    UserHistoryCode,
} from '@interfaces/services/userHistory'

export default class UserSigningHistoryDataMapper {
    constructor(private readonly userHistoryDataMapper: UserHistoryDataMapper) {}

    toEntity(model: UserSigningHistoryItemModel): HistoryItem {
        const { resourceId, date, documents, offer } = model
        const recipient = this.getRecipient(model)

        return {
            id: resourceId,
            status: this.userHistoryDataMapper.getStatus(model),
            date: moment(date).format(this.userHistoryDataMapper.dateFormatV1),
            documents,
            recipient,
            purpose: offer?.name,
        }
    }

    toHistoryItemEntityV1(model: UserSigningHistoryItemModel, action: UserHistoryCode): HistoryItemByCode {
        const { resourceId, date } = model
        const recipient = this.getRecipient(model)

        const status = this.userHistoryDataMapper.getStatus(model)

        return {
            id: resourceId,
            status,
            statusName: this.userHistoryDataMapper.getHistoryItemStatusNameByActionAndStatus(action, status),
            date: moment(date).format(this.userHistoryDataMapper.dateFormatV1),
            recipient,
        }
    }

    toHistoryItemEntity(model: UserSigningHistoryItemModel, action: UserHistoryCode): CardMlc {
        const { resourceId, date } = model
        const recipient = this.getRecipient(model)

        const status = this.userHistoryDataMapper.getStatus(model)

        return {
            id: resourceId,
            chipStatusAtm: {
                code: status,
                name: this.userHistoryDataMapper.getHistoryItemStatusNameByActionAndStatus(action, status),
                type: this.userHistoryDataMapper.getHistoryStatusChipTypeByStatus(status),
            },
            title: recipient.name,
            subtitles: [],
            description: recipient.address,
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

    getHistoryItemV1(model: UserSigningHistoryItemModel, action: UserHistoryCode, payload: GetHistoryItemBodyPayload): SigningHistoryItem {
        const { status, statusName, date, recipient } = this.toHistoryItemEntityV1(model, action)

        return {
            title: this.userHistoryDataMapper.getHistoryItemTitleByAction(action),
            status,
            statusMessage: {
                title: statusName,
                text: date,
                icon: this.userHistoryDataMapper.getHistoryItemStatusMessageIconByStatus(status),
                parameters: [],
            },
            recipient,
            body: this.userHistoryDataMapper.getHistoryItemBodyByAction(action, payload),
        }
    }

    getHistoryItemTextLabelMlcByAction(
        action: UserHistoryCode,
        address: string,
        payload: GetHistoryItemBodyPayload,
    ): TextLabelMlc | undefined {
        const { platformType, platformVersion, documents } = payload
        switch (action) {
            case UserHistoryCode.Authorization: {
                return {
                    text: `${address}. \n\nПристрій, з якого здійснено авторизацію: \n${platformType} ${platformVersion}`,
                    parameters: [],
                }
            }
            case UserHistoryCode.Signing: {
                let text = `${address}. \n\nБуло підписано наступні документи:\n• ${documents.join('\n• ')}`

                if (platformType && platformVersion) {
                    text += `\n\nПристрій, з якого підписано: \n${platformType} ${platformVersion}`
                }

                return {
                    text,
                    parameters: [],
                }
            }
            case UserHistoryCode.Sharing: {
                break
            }
            default: {
                const unhandledAction: never = action

                throw new TypeError(`Unhandled history signing code action type: ${unhandledAction}`)
            }
        }
    }

    getHistoryItem(
        model: UserSigningHistoryItemModel,
        action: UserHistoryCode,
        payload: GetHistoryItemBodyPayload,
    ): HistoryItemResponse['body'] {
        const { date } = model
        const recipient = this.getRecipient(model)
        const status = this.userHistoryDataMapper.getStatus(model)

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
                    label: recipient.name,
                },
            },
            { textLabelMlc: this.getHistoryItemTextLabelMlcByAction(action, recipient.address, payload) },
        ]
    }

    private getRecipient(model: UserSigningHistoryItemModel): HistoryActionRecipient {
        const { acquirer, recipient } = model

        if (acquirer) {
            return { name: acquirer.name, address: acquirer.address }
        }

        if (recipient) {
            return { name: recipient.name, address: recipient.address }
        }

        throw new UnprocessableEntityError('Missing acquirer and recipient in model')
    }
}
