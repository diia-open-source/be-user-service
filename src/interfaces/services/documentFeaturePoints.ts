export interface CheckPointsResult {
    documentType: string
    documentIdentifier: string
}

export interface GetPointsResult {
    documentType: string
    documentIdentifier: string
    points: number[]
}

export interface FeaturePointResponse {
    feature_points: number[]
}
