import { DocumentFeaturePointsModel } from '@interfaces/models/documentFeaturePoints'
import { CheckPointsResult, GetPointsResult } from '@interfaces/services/documentFeaturePoints'

export default class DocumentFeaturePointsDataMapper {
    toCheckResult(model: Omit<DocumentFeaturePointsModel, 'points'>): CheckPointsResult {
        const { documentType, documentIdentifier } = model

        return { documentType, documentIdentifier }
    }

    toGetResult(model: DocumentFeaturePointsModel): GetPointsResult {
        const { documentType, documentIdentifier, points = [] } = model

        return { documentType, documentIdentifier, points }
    }
}
