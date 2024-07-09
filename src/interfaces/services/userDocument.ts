import { AnyBulkWriteOperation } from '@diia-inhouse/db'
import { DocStatus, OwnerType } from '@diia-inhouse/types'

import { UserDocument } from '@interfaces/models/userDocument'

export interface GetUserDocumentsParams {
    userIdentifier: string
    documentType?: string
    mobileUid?: string
    activeOnly?: boolean
}

export interface DocumentToVerify {
    documentType: string
    documentIdentifer: string
}

export interface VerifiedDocument {
    documentType: string
    documentIdentifer: string
    isOwner: boolean
}

export type UserDocumentTypesCounts = Record<string, number>

export interface DocumentFilter {
    documentType: string
    documentIdentifier?: string
    ownerType?: OwnerType
    docStatus?: DocStatus[]
    docId?: string
}

export type UserDocumentsDistinctItem = Pick<UserDocument, 'documentType' | 'ownerType' | 'docStatus'>

export type AvailableDocumentsMap = Map<string, [Set<OwnerType>, Set<DocStatus>]>

export interface HasDocumentsResult {
    hasDocuments: boolean
    missingDocuments: string[]
}

export type ProcessingStrategy = (
    userIdentifier: string,
    sourceDocs: UserDocument[],
    docToCompare: UserDocument,
) => Promise<AnyBulkWriteOperation<UserDocument>[]>
