import { DocumentType } from '@diia-inhouse/types'

export interface CheckPointsResult {
    documentType: DocumentType
    documentIdentifier: string
}

export interface GetPointsResult {
    documentType: DocumentType
    documentIdentifier: string
    points: number[]
}

export interface FeaturePointResponse {
    feature_points: number[]
}
