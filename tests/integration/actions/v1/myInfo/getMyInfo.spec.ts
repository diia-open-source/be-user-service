import TestKit from '@diia-inhouse/test'
import { Gender, Icon } from '@diia-inhouse/types'

import GetMyInfoAction from '@src/actions/v1/myInfo/getMyInfo'
import { DefaultImage } from '@src/generated'

import userProfileModel from '@models/userProfile'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/myInfo/getMyInfo'
import { ProcessCode } from '@interfaces/services'
import { ActionType } from '@interfaces/services/myInfo'

describe(`Action ${GetMyInfoAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getMyInfoAction: GetMyInfoAction
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()

        getMyInfoAction = app.container.build(GetMyInfoAction)
        testKit = app.container.resolve<TestKit>('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return screen with default image when setting is false', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession({ gender: Gender.female })

        await userProfileModel.create({
            identifier: session.user.identifier,
            gender: Gender.female,
            birthDay: new Date(0),
            settings: {
                myInfoUsePassportPhoto: false,
            },
        })

        // Act
        const result = await getMyInfoAction.handler({ session, headers })

        // Assert
        expect(result).toEqual<ActionResult>({
            topGroup: [],
            body: [
                {
                    userCardMlc: {
                        userPictureAtm: {
                            useDocPhoto: false,
                            defaultImageCode: DefaultImage.userFemale,
                            action: {
                                type: ActionType.ChangeUseDocPhoto,
                            },
                        },
                        label: 'Надія Дія',
                        description: expect.any(String),
                    },
                },
                {
                    listItemGroupOrg: {
                        items: [
                            {
                                label: expect.any(String),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.UserBirthRecord,
                                },
                            },
                            {
                                label: expect.any(String),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.ToChangeNameRecords,
                                },
                            },
                            {
                                label: expect.any(String),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.Family,
                                },
                            },
                        ],
                    },
                },
            ],
        })
    })

    it(`should return screen with process code ${ProcessCode.PermissionToUseDocPhotoRequired} when setting not exist`, async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession({ gender: Gender.female })

        // Act
        const result = await getMyInfoAction.handler({ session, headers })

        // Assert
        expect(result).toEqual<ActionResult>({
            topGroup: [],
            body: [
                {
                    userCardMlc: {
                        userPictureAtm: {
                            useDocPhoto: false,
                            defaultImageCode: DefaultImage.userFemale,
                            action: {
                                type: ActionType.ChangeUseDocPhoto,
                            },
                        },
                        label: 'Надія Дія',
                        description: expect.any(String),
                    },
                },
                {
                    listItemGroupOrg: {
                        items: [
                            {
                                label: expect.any(String),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.UserBirthRecord,
                                },
                            },
                            {
                                label: expect.any(String),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.ToChangeNameRecords,
                                },
                            },
                            {
                                label: expect.any(String),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.Family,
                                },
                            },
                        ],
                    },
                },
            ],
            processCode: ProcessCode.PermissionToUseDocPhotoRequired,
        })
    })
})
