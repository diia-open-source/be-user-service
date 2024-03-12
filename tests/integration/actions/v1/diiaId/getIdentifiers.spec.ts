import { randomUUID } from 'crypto'

import moment from 'moment'

import { I18nService } from '@diia-inhouse/i18n'
import TestKit from '@diia-inhouse/test'

import GetDiiaIdIdentifiersAction from '@actions/v1/diiaId/getIdentifiers'

import diiaIdModel from '@models/diiaId'
import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import { getApp } from '@tests/utils/getApp'

import { DiiaId, SignAlgo } from '@interfaces/models/diiaId'
import { UserSigningHistoryItem } from '@interfaces/models/userSigningHistoryItem'
import { DiiaIdIdentifiersResponseV1 } from '@interfaces/services/diiaId'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetDiiaIdIdentifiersAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let i18n: I18nService
    let getDiiaIdIdentifiersAction: GetDiiaIdIdentifiersAction
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()

        i18n = app.container.resolve('i18n')
        getDiiaIdIdentifiersAction = app.container.build(GetDiiaIdIdentifiersAction)
        testKit = app.container.resolve<TestKit>('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return valid response when filled available diia ids and user signings history', async () => {
        // arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const { identifier: userIdentifier } = session.user
        const { mobileUid } = headers

        const signings: UserSigningHistoryItem[] = [...new Array(3)].map(() => ({
            userIdentifier: userIdentifier,
            sessionId: randomUUID(),
            resourceId: randomUUID(),
            status: UserHistoryItemStatus.Done,
            statusHistory: [
                {
                    status: UserHistoryItemStatus.Done,
                    date: new Date(),
                },
            ],
            documents: ['test1', 'test2'],
            date: new Date(),
        }))

        await userSigningHistoryItemModel.insertMany(signings)

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
        const response = await getDiiaIdIdentifiersAction.handler({ session, headers })

        // assert
        const { identifier, signAlgo } = createModel

        expect(response).toMatchObject<DiiaIdIdentifiersResponseV1>({
            identifiers: [{ identifier, signAlgo }],
            hasSigningHistory: true,
            stubMessage: undefined,
        })
    })

    it('should return valid response when filled available diia ids and empty user signings history', async () => {
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
        const response = await getDiiaIdIdentifiersAction.handler({ session, headers })

        // assert
        const { identifier, signAlgo } = createModel

        expect(response).toMatchObject<DiiaIdIdentifiersResponseV1>({
            identifiers: [{ identifier, signAlgo }],
            hasSigningHistory: false,
            stubMessage: {
                icon: '🤷‍♂️',
                text: i18n.get('diiaId.getIdentifier.v2.activated.noDocumentWasSigned'),
            },
        })
    })
})
