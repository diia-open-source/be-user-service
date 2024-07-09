import { randomUUID } from 'node:crypto'

import moment from 'moment'

import TestKit from '@diia-inhouse/test'

import CheckIdentifierAvailabilityAction from '@actions/v2/diiaId/checkIdentifierAvailability'

import diiaIdModel from '@models/diiaId'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v2/diiaId/checkIdentifierAvailability'
import { DiiaId, SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${CheckIdentifierAvailabilityAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let action: CheckIdentifierAvailabilityAction
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()
        action = app.container.build(CheckIdentifierAvailabilityAction)
        testKit = app.container.resolve('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it("should return empty identifiers when doesn't have available diia ids", async () => {
        // arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        // act
        const response = await action.handler({ session, headers })

        // assert
        expect(response).toMatchObject<ActionResult>({
            identifiers: [],
        })
    })

    it('should return identifiers when has available diia ids', async () => {
        // arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const { identifier: userIdentifier } = session.user
        const { mobileUid } = headers

        const createModel: DiiaId = {
            userIdentifier,
            mobileUid,
            identifier: randomUUID(),
            signAlgo: SignAlgo.DSTU,
            isDeleted: false,
            creationDate: moment().toDate(),
            expirationDate: moment().add(30, 'minutes').toDate(),
        }

        await diiaIdModel.create(createModel)

        // act
        const response = await action.handler({ session, headers })

        // assert
        const { identifier, signAlgo } = createModel

        expect(response).toMatchObject<ActionResult>({
            identifiers: [{ identifier, signAlgo }],
        })
    })

    it('should ignore diia ids in creation process', async () => {
        // arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const { identifier: userIdentifier } = session.user
        const { mobileUid } = headers

        const createModel: DiiaId = {
            userIdentifier,
            mobileUid,
            identifier: randomUUID(),
            signAlgo: SignAlgo.DSTU,
            isDeleted: false,
        }

        await diiaIdModel.create(createModel)

        // act
        const response = await action.handler({ session, headers })

        // assert
        expect(response).toMatchObject<ActionResult>({
            identifiers: [],
        })
    })

    it('should soft delete expired creation diia ids', async () => {
        // arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const { identifier: userIdentifier } = session.user
        const { mobileUid } = headers

        const createModel: DiiaId & { createdAt: Date } = {
            userIdentifier,
            mobileUid,
            identifier: randomUUID(),
            signAlgo: SignAlgo.DSTU,
            isDeleted: false,
            createdAt: moment().subtract(10, 'minutes').toDate(),
        }

        const diiaId = await diiaIdModel.create(createModel)

        // act
        const response = await action.handler({ session, headers })

        // assert
        const updatedModel = await diiaIdModel.findById(diiaId._id)

        expect(response).toMatchObject<ActionResult>({
            identifiers: [],
        })
        expect(updatedModel?.isDeleted).toBe(true)
    })
})
