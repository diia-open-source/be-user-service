import { randomUUID } from 'crypto'

import TestKit from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import documentFeaturePointsModel from '@models/documentFeaturePoints'

import DocumentFeaturePointsDataMapper from '@dataMappers/documentFeaturePointsDataMapper'

describe(`Data Mapper ${DocumentFeaturePointsDataMapper.name}`, () => {
    const testKit = new TestKit()
    const dataMapper = new DocumentFeaturePointsDataMapper()

    describe(`method ${dataMapper.toCheckResult.name}`, () => {
        it('should return check points result when feature points model passed', () => {
            const documentType = DocumentType.InternalPassport
            const documentIdentifier = randomUUID()
            const model = new documentFeaturePointsModel({
                userIdentifier: randomUUID(),
                documentType,
                documentIdentifier,
                requestId: randomUUID(),
            })

            const result = dataMapper.toCheckResult(model)

            expect(result).toEqual({ documentType, documentIdentifier })
        })
    })

    describe(`method ${dataMapper.toGetResult.name}`, () => {
        it('should return feature points result when feature points model passed', () => {
            const documentType = DocumentType.InternalPassport
            const documentIdentifier = randomUUID()
            const points = [...Array(testKit.random.getRandomInt(0, 100))].map(() => testKit.random.getRandomInt(0, 100))
            const model = new documentFeaturePointsModel({
                userIdentifier: randomUUID(),
                documentType,
                documentIdentifier,
                requestId: randomUUID(),
                points,
            })

            const result = dataMapper.toGetResult(model)

            expect(result).toEqual({ documentType, documentIdentifier, points })
        })
    })
})
