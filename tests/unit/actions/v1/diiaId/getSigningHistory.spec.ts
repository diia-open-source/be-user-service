import GetDiiaIdSigningHistoryAction from '@actions/v1/diiaId/getSigningHistory'

describe(`Action ${GetDiiaIdSigningHistoryAction.name}`, () => {
    const getDiiaIdSigningHistoryAction = new GetDiiaIdSigningHistoryAction()

    describe('Method `handler`', () => {
        it('should return result of signing history', async () => {
            expect(await getDiiaIdSigningHistoryAction.handler()).toMatchObject({ signingRequests: [], total: 0 })
        })
    })
})
