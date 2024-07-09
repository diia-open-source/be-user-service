import {
    ChipStatusAtmType,
    MessageBodyItem,
    MessageBodyItemType,
    NavigationPanel,
    NavigationPanelMlc,
    PublicServiceContextMenuType,
    StubMessageMlc,
} from '@diia-inhouse/types'

import { StatusHistoryItem, UserSharingHistoryItemModel } from '@interfaces/models/userSharingHistoryItem'
import { UserSigningHistoryItemModel } from '@interfaces/models/userSigningHistoryItem'
import {
    GetHistoryItemBodyPayload,
    HistoryResponseByCodeStubMessage,
    UserHistoryCode,
    UserHistoryItemStatus,
} from '@interfaces/services/userHistory'

export default class UserHistoryDataMapper {
    readonly failHistoryItemThreshold: number = 1000 * 60 * 60

    readonly dateFormatV1: string = 'DD.MM.YYYY / HH:mm'

    readonly dateFormat: string = 'dd.MM.yyyy HH:mm'

    private readonly stubMessageByActionV1: Record<UserHistoryCode, HistoryResponseByCodeStubMessage> = {
        [UserHistoryCode.Authorization]: {
            icon: '🤷‍♂️',
            text: 'Ви ще не здійснювали \nавторизацію через Дія.Підпис.',
        },
        [UserHistoryCode.Signing]: {
            icon: '🤷‍♂️',
            text: 'Ви ще не підписали жодного \nдокумента в Дії.',
        },
        [UserHistoryCode.Sharing]: {
            icon: '📄',
            text: 'Тут ви зможете переглянути історію запитів на копії ваших цифрових документів.',
        },
    }

    private readonly stubMessageByAction: Record<UserHistoryCode, StubMessageMlc> = {
        [UserHistoryCode.Authorization]: {
            icon: '🤷‍♂️',
            title: 'Ви ще не здійснювали \nавторизацію через Дія.Підпис.',
            parameters: [],
        },
        [UserHistoryCode.Signing]: {
            icon: '🤷‍♂️',
            title: 'Ви ще не підписали жодного \nдокумента в Дії.',
            parameters: [],
        },
        [UserHistoryCode.Sharing]: {
            icon: '📄',
            title: 'Тут ви зможете переглянути історію запитів на копії ваших цифрових документів.',
            parameters: [],
        },
    }

    private readonly historyItemTitleByAction: Record<UserHistoryCode, string> = {
        [UserHistoryCode.Authorization]: 'Запит на авторизацію з Дія.Підпис',
        [UserHistoryCode.Signing]: 'Запит на підписання цифрових документів',
        [UserHistoryCode.Sharing]: 'Запит на копії цифрових документів',
    }

    private readonly historyItemStatusMessageIconByStatus: Record<UserHistoryItemStatus, string> = {
        [UserHistoryItemStatus.Done]: '✅',
        [UserHistoryItemStatus.Refuse]: '🚫',
        [UserHistoryItemStatus.Processing]: '⏳',
    }

    private readonly historyItemStatusNameByActionAndStatus: Record<UserHistoryCode, Record<UserHistoryItemStatus, string>> = {
        [UserHistoryCode.Authorization]: {
            [UserHistoryItemStatus.Done]: 'Авторизовано',
            [UserHistoryItemStatus.Refuse]: 'Не авторизовано',
            [UserHistoryItemStatus.Processing]: 'Авторизуємо',
        },
        [UserHistoryCode.Signing]: {
            [UserHistoryItemStatus.Done]: 'Підписано',
            [UserHistoryItemStatus.Refuse]: 'Не підписано',
            [UserHistoryItemStatus.Processing]: 'Підписуємо',
        },
        [UserHistoryCode.Sharing]: {
            [UserHistoryItemStatus.Done]: 'Виконано',
            [UserHistoryItemStatus.Refuse]: 'Відмовлено',
            [UserHistoryItemStatus.Processing]: 'В обробці',
        },
    }

    private readonly historyStatusChipTypeByStatus: Record<UserHistoryItemStatus, ChipStatusAtmType> = {
        [UserHistoryItemStatus.Done]: ChipStatusAtmType.success,
        [UserHistoryItemStatus.Refuse]: ChipStatusAtmType.neutral,
        [UserHistoryItemStatus.Processing]: ChipStatusAtmType.pending,
    }

    getStatus(model: UserSharingHistoryItemModel | UserSigningHistoryItemModel): UserHistoryItemStatus {
        const { status, statusHistory } = model
        if (status !== UserHistoryItemStatus.Processing) {
            return status
        }

        const { date: statusDate } = <StatusHistoryItem>statusHistory.at(-1)

        const threshold: number = statusDate.getTime() + this.failHistoryItemThreshold
        const now: number = Date.now()
        const responseStatus: UserHistoryItemStatus = now > threshold ? UserHistoryItemStatus.Refuse : status

        return responseStatus
    }

    getHistoryScreenNavigationPanel(): NavigationPanel {
        return {
            header: 'Дія.Підпис',
            contextMenu: [
                {
                    type: PublicServiceContextMenuType.faqCategory,
                    code: 'diiaId',
                    name: 'Питання та відповіді',
                },
                {
                    type: PublicServiceContextMenuType.supportServiceScreen,
                    name: 'Служба підтримки',
                },
            ],
        }
    }

    getHistoryScreenNavigationPanelMlc(label?: string): NavigationPanelMlc {
        return {
            label: label || 'Історія підписань',
            ellipseMenu: [
                {
                    type: PublicServiceContextMenuType.faqCategory,
                    name: 'Питання та відповіді',
                    code: 'diiaId',
                },
                {
                    type: PublicServiceContextMenuType.supportServiceScreen,
                    name: 'Служба підтримки',
                },
            ],
        }
    }

    getStubMessageByActionV1(action: UserHistoryCode): HistoryResponseByCodeStubMessage {
        return this.stubMessageByActionV1[action]
    }

    getStubMessageByAction(action: UserHistoryCode): StubMessageMlc {
        return this.stubMessageByAction[action]
    }

    getHistoryItemTitleByAction(action: UserHistoryCode): string {
        return this.historyItemTitleByAction[action]
    }

    getHistoryItemStatusMessageIconByStatus(status: UserHistoryItemStatus): string {
        return this.historyItemStatusMessageIconByStatus[status]
    }

    getHistoryItemStatusNameByActionAndStatus(action: UserHistoryCode, status: UserHistoryItemStatus): string {
        return this.historyItemStatusNameByActionAndStatus[action][status]
    }

    getHistoryStatusChipTypeByStatus(status: UserHistoryItemStatus): ChipStatusAtmType {
        return this.historyStatusChipTypeByStatus[status]
    }

    getHistoryItemBodyByAction(action: UserHistoryCode, payload: GetHistoryItemBodyPayload): MessageBodyItem[] {
        const { platformType, platformVersion, documents } = payload
        switch (action) {
            case UserHistoryCode.Authorization: {
                return [
                    {
                        type: MessageBodyItemType.text,
                        data: {
                            text: `Пристрій, з якого здійснено авторизацію: \n${platformType} ${platformVersion}`,
                            parameters: [],
                        },
                    },
                ]
            }
            case UserHistoryCode.Signing: {
                let text = `Було підписано наступні документи:\n• ${documents.join('\n• ')}`

                if (platformType && platformVersion) {
                    text += `\n\nПристрій, з якого підписано: \n${platformType} ${platformVersion}`
                }

                return [
                    {
                        type: MessageBodyItemType.text,
                        data: {
                            text,
                            parameters: [],
                        },
                    },
                ]
            }
            case UserHistoryCode.Sharing: {
                return []
            }
            default: {
                const unhandledAction: never = action

                throw new TypeError(`Unhandled history signing code action type: ${unhandledAction}`)
            }
        }
    }
}
