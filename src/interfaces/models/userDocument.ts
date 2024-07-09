import { Document } from '@diia-inhouse/db'
import { DocStatus, OwnerType } from '@diia-inhouse/types'

import { ComparedTo, UserCompoundDocument, UserDocumentData } from '@interfaces/services/documents'
import { MessageTemplateCode } from '@interfaces/services/notification'

export type UserDocumentsNotifications = Partial<Record<MessageTemplateCode, Date>>

export interface UserDocument {
    userIdentifier: string
    mobileUid?: string
    documentType: string
    documentSubType?: string
    documentIdentifier: string
    normalizedDocumentIdentifier?: string
    fullNameHash?: string
    ownerType: OwnerType
    docId?: string
    docStatus?: DocStatus
    documentData?: UserDocumentData
    compoundDocument?: UserCompoundDocument
    registrationDate?: Date
    issueDate?: Date
    expirationDate?: Date
    notifications: UserDocumentsNotifications
    comparedTo?: ComparedTo
}

export interface UserDocumentModel extends UserDocument, Document {}
