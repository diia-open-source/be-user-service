import { RatingForm } from '@diia-inhouse/analytics'
import {
    AttentionMessage,
    MessageBodyItem,
    NavigationPanel,
    PaginationListOrg,
    StatusMessageMlc,
    StubMessageMlc,
    SubtitleLabelMlc,
    TextLabelMlc,
    TitleLabelMlc,
    TopGroupOrg,
} from '@diia-inhouse/types'

export enum HistoryAction {
    Sharing = 'sharing',
    Signing = 'signing',
}

export enum UserHistoryItemStatus {
    Processing = 'processing',
    Refuse = 'refuse',
    Done = 'done',
}

export enum UserHistoryCode {
    Authorization = 'authorization',
    Signing = 'signing',
    Sharing = 'sharing',
}

export interface HistoryActionRecipient {
    name: string
    address: string
}

export interface HistoryItem {
    id: string
    status: UserHistoryItemStatus
    recipient: HistoryActionRecipient
    date: string
    documents: string[]
    purpose?: string
}

export interface GetHistoryItemBodyPayload {
    platformType?: string
    platformVersion?: string
    documents: string[]
}

export interface HistoryItemByCode {
    id: string
    status: UserHistoryItemStatus
    statusName: string
    recipient: HistoryActionRecipient
    date: string
}

export interface SigningHistoryItemResponseV1 {
    navigationPanel?: NavigationPanel
    screen: SigningHistoryItem
    ratingForm?: RatingForm
}

export interface HistoryItemResponseBodyItem {
    titleLabelMlc?: TitleLabelMlc
    statusMessageMlc?: StatusMessageMlc
    subtitleLabelMlc?: SubtitleLabelMlc
    textLabelMlc?: TextLabelMlc
}

export interface HistoryItemResponse {
    topGroup?: [
        {
            topGroupOrg?: TopGroupOrg
        },
    ]
    body: HistoryItemResponseBodyItem[]
    ratingForm?: RatingForm
}

export interface SigningHistoryItem {
    title: string
    status: UserHistoryItemStatus
    statusMessage: AttentionMessage
    recipient: HistoryActionRecipient
    body: MessageBodyItem[]
}

export interface HistoryResponse {
    history: HistoryItem[]
    total: number
}

export interface HistoryResponseByCodeStubMessage {
    icon: string
    text: string
}

export interface HistoryResponseByCodeV1 {
    items: HistoryItemByCode[]
    total: number
    stubMessage?: HistoryResponseByCodeStubMessage
}

export interface HistoryResponseByCodeBodyItem {
    stubMessageMlc?: StubMessageMlc
    paginationListOrg?: PaginationListOrg
}

export interface HistoryResponseByCode {
    body: HistoryResponseByCodeBodyItem[]
    total: number
}

export interface HistoryScreenTab {
    name: string
    code: UserHistoryCode
    count?: number
}

export interface HistoryScreenResponseV1 {
    navigationPanel?: NavigationPanel
    tabs: {
        items: HistoryScreenTab[]
        preselectedCode: UserHistoryCode
    }
}

export interface HistoryScreenResponse {
    topGroup?: [
        {
            topGroupOrg: TopGroupOrg
        },
    ]
}

export interface UserHistoryItemStatusRecord {
    sharingId: string
    status: UserHistoryItemStatus
    date: Date
}
