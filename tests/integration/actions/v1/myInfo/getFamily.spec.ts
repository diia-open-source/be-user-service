import { Icon } from '@diia-inhouse/types'

import GetFamilyAction from '@src/actions/v1/myInfo/getFamily'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/myInfo/getFamily'
import { ActionType } from '@interfaces/services/myInfo'

describe(`Action ${GetFamilyAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getFamilyAction: GetFamilyAction

    beforeAll(async () => {
        app = await getApp()

        getFamilyAction = app.container.build(GetFamilyAction)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return valid response with 3 list items', async () => {
        // Arrange
        // ...

        // Act
        const result = await getFamilyAction.handler()

        // Assert
        expect(result).toEqual<ActionResult>({
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc: {
                            label: expect.any(String),
                            ellipseMenu: [],
                        },
                    },
                },
            ],
            body: [
                {
                    listItemGroupOrg: {
                        items: [
                            {
                                label: expect.any(String),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.MarriageRecord,
                                },
                            },
                            {
                                label: expect.any(String),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.DivorceRecord,
                                },
                            },
                            {
                                label: expect.any(String),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.BirthCertificate,
                                },
                            },
                        ],
                    },
                },
            ],
        })
    })
})
