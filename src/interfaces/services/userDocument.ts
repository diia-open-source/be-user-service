import { AnyBulkWriteOperation } from 'mongodb'

import { DocStatus, DocumentType, OwnerType } from '@diia-inhouse/types'

import { UserDocument } from '@interfaces/models/userDocument'

export interface GetUserDocumentsParams {
    userIdentifier: string
    documentType?: DocumentType
    mobileUid?: string
    activeOnly?: boolean
}

export interface DocumentToVerify {
    documentType: DocumentType
    documentIdentifer: string
}

export interface VerifiedDocument {
    documentType: DocumentType
    documentIdentifer: string
    isOwner: boolean
}

export type UserDocumentTypesCounts = Partial<Record<DocumentType, number>>

export interface DocumentFilter {
    documentType: DocumentType
    documentIdentifier?: string
    ownerType?: OwnerType
    docStatus?: DocStatus[]
    docId?: string
}

export type UserDocumentsDistinctItem = Pick<UserDocument, 'documentType' | 'ownerType' | 'docStatus'>

export type AvailableDocumentsMap = Map<DocumentType, [Set<OwnerType>, Set<DocStatus>]>

export interface HasDocumentsResult {
    hasDocuments: boolean
    missingDocuments: DocumentType[]
}

export type ProcessingStrategy = (
    userIdentifier: string,
    sourceDocs: UserDocument[],
    docToCompare: UserDocument,
) => Promise<AnyBulkWriteOperation<UserDocument>[]>
