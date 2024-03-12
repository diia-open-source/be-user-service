import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDiiaIdIdentifierAction from '@actions/v1/diiaId/getIdentifier'

import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${GetDiiaIdIdentifierAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)

    const getDiiaIdIdentifierAction = new GetDiiaIdIdentifierAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return diiaId', async () => {
            const args = {
                params: { signAlgo: SignAlgo.DSTU },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const diiaIdResponse = {
                identifier: 'identifier',
                creationDate: 'creationDate',
                expirationDate: 'expirationDate',
                passport: {
                    docNumber: 'docNumber',
                    lastNameUA: 'lastNameUA',
                    firstNameUA: 'firstNameUA',
                    middleNameUA: 'middleNameUA',
                    photo: 'photo',
                    sign: 'sign',
                },
            }

            jest.spyOn(diiaIdServiceMock, 'getIdentifierV1').mockResolvedValueOnce(diiaIdResponse)

            expect(await getDiiaIdIdentifierAction.handler(args)).toMatchObject({ diiaId: diiaIdResponse })

            expect(diiaIdServiceMock.getIdentifierV1).toHaveBeenCalledWith(args.session.user, args.headers.mobileUid, args.params.signAlgo)
        })
    })
})
