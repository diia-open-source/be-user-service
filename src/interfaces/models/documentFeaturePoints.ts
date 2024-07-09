import { Document } from '@diia-inhouse/db'

export interface DocumentFeaturePoints {
    userIdentifier: string
    documentType: string
    documentIdentifier: string
    requestId: string
    points?: number[]
}

export interface DocumentFeaturePointsModel extends DocumentFeaturePoints, Document {}
