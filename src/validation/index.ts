import { DocumentType, OwnerType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import { UserProfileDocument } from '@interfaces/services/documents'

export const userProfileDocumentValidationSchema: ValidationSchema<UserProfileDocument> = {
    documentIdentifier: { type: 'string' },
    documentSubType: { type: 'string', optional: true },
    ownerType: { type: 'string', enum: Object.values(OwnerType) },
    docId: { type: 'string' },
    docStatus: { type: 'number' },
    compoundDocument: {
        type: 'object',
        optional: true,
        props: {
            documentType: { type: 'string', enum: Object.values(DocumentType) },
            documentIdentifier: { type: 'string' },
        },
    },
    registrationDate: { type: 'date', convert: true, optional: true },
    issueDate: { type: 'date', convert: true, optional: true },
    expirationDate: { type: 'date', convert: true, optional: true },
    normalizedDocumentIdentifier: { type: 'string', optional: true },
    fullNameHash: { type: 'string', optional: true },
    comparedTo: {
        type: 'object',
        optional: true,
        props: {
            documentType: { type: 'string', enum: Object.values(DocumentType) },
            fullNameHash: { type: 'string' },
        },
    },
    documentData: { type: 'object', optional: true },
}
