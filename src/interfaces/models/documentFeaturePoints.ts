import { Document } from 'mongoose'

import { DocumentType } from '@diia-inhouse/types'

export interface DocumentFeaturePoints {
    userIdentifier: string
    documentType: DocumentType
    documentIdentifier: string
    requestId: string
    points?: number[]
}

export interface DocumentFeaturePointsModel extends DocumentFeaturePoints, Document {}
