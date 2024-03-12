import DiiaLogger from '@diia-inhouse/diia-logger'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import DocumentsAdultRegistrationAddressCommunityEventListener from '@src/eventListeners/documentsAdultRegistrationAddressCommunity'

import AddressService from '@services/address'
import UserProfileService from '@services/userProfile'

import { EventPayload } from '@interfaces/eventListeners/documentsAdultRegistrationAddressCommunity'

describe('DocumentsAdultRegistrationAddressCommunityEventListener', () => {
    const testKit = new TestKit()
    const addressServiceMock = mockInstance(AddressService)
    const userProfileServiceMock = mockInstance(UserProfileService)
    const loggerMock = mockInstance(DiiaLogger)
    const documentsAdultRegistrationAddressCommunityEventListener = new DocumentsAdultRegistrationAddressCommunityEventListener(
        addressServiceMock,
        userProfileServiceMock,
        loggerMock,
    )

    describe('method: `handler`', () => {
        const {
            user: { birthDay, fName, lName, mName, gender, identifier: userIdentifier },
        } = testKit.session.getUserSession()

        it.each([
            [
                'should successfully update user community',
                {
                    birthDay,
                    fName,
                    gender,
                    lName,
                    mName,
                    userIdentifier,
                    koatuu: 'koatuu',
                },
                (): void => {
                    jest.spyOn(addressServiceMock, 'findCommunityCodeByKoatuu').mockResolvedValueOnce('code')
                    jest.spyOn(userProfileServiceMock, 'updateUserCommunity').mockResolvedValueOnce()
                },
                (): void => {
                    expect(addressServiceMock.findCommunityCodeByKoatuu).toHaveBeenCalledWith('koatuu')
                    expect(userProfileServiceMock.updateUserCommunity).toHaveBeenCalledWith(userIdentifier, 'code')
                },
            ],
            [
                'should just log if no user community to update',
                {
                    birthDay,
                    fName,
                    gender,
                    lName,
                    mName,
                    userIdentifier,
                },
                (): void => {},
                (): void => {
                    expect(loggerMock.info).toHaveBeenCalledWith('No user community to update', { userIdentifier })
                },
            ],
            [
                "should just log in case couldn't find community code by koatuu",
                {
                    birthDay,
                    fName,
                    gender,
                    lName,
                    mName,
                    userIdentifier,
                    koatuu: 'koatuu',
                },
                (): void => {
                    jest.spyOn(addressServiceMock, 'findCommunityCodeByKoatuu').mockResolvedValueOnce('')
                },
                (): void => {
                    expect(addressServiceMock.findCommunityCodeByKoatuu).toHaveBeenCalledWith('koatuu')
                    expect(loggerMock.info).toHaveBeenCalledWith("Couldn't find community code by koatuu", {
                        userIdentifier,
                        koatuu: 'koatuu',
                    })
                },
            ],
        ])('%s', async (_msg: string, message: EventPayload, defineSpies: CallableFunction, checkExpectations: CallableFunction) => {
            defineSpies()

            expect(await documentsAdultRegistrationAddressCommunityEventListener.handler(message)).toBeUndefined()

            checkExpectations()
        })
    })
})
