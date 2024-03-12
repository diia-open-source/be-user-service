import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDpsPreparedPackageAction from '@actions/v1/diiaId/getDpsPreparedPackage'

import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${GetDpsPreparedPackageAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)

    const getDpsPreparedPackageAction = new GetDpsPreparedPackageAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return tax package', async () => {
            const args = {
                params: { signAlgo: SignAlgo.DSTU },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const taxReportDao = [{ fname: 'fname', contentBase64: 'contentBase64' }]

            jest.spyOn(diiaIdServiceMock, 'getDpsPreparedPackage').mockResolvedValueOnce(taxReportDao)

            expect(await getDpsPreparedPackageAction.handler(args)).toMatchObject({ taxPackage: taxReportDao })

            expect(diiaIdServiceMock.getDpsPreparedPackage).toHaveBeenCalledWith(
                args.session.user.identifier,
                args.headers.mobileUid,
                args.params.signAlgo,
            )
        })
    })
})
