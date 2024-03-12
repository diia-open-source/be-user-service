import TestKit from '@diia-inhouse/test'

const unregisteredOfficeProfileMock = {
    deleteOne: jest.fn(),
    updateOne: jest.fn(),
    findOne: jest.fn(),
    modelName: 'UnregisteredOfficeProfile',
}

jest.mock('@models/unregisteredOfficeProfile', () => unregisteredOfficeProfileMock)

import UnregisteredOfficeProfile from '@services/unregisteredOfficeProfile'

import { DiiaOfficeStatus } from '@interfaces/models/userProfile'

describe(`Service ${UnregisteredOfficeProfile.name}`, () => {
    const testKit = new TestKit()
    const unregisteredOfficeProfile = new UnregisteredOfficeProfile()
    const identifier = testKit.session.getUserSession().user.identifier

    const profile = {
        profileId: 'profileId',
        organizationId: 'organizationId',
        unitId: 'unitId',
        scopes: ['scope1'],
        isOrganizationAdmin: false,
        status: DiiaOfficeStatus.Active,
    }

    describe('method: `addUnregisteredProfile`', () => {
        it('should successfully add unregistered profile', async () => {
            jest.spyOn(unregisteredOfficeProfileMock, 'deleteOne').mockResolvedValueOnce(true)
            jest.spyOn(unregisteredOfficeProfileMock, 'updateOne').mockResolvedValueOnce(true)

            await unregisteredOfficeProfile.addUnregisteredProfile(identifier, profile)

            expect(unregisteredOfficeProfileMock.deleteOne).toHaveBeenCalledWith({
                'profile.profileId': profile.profileId,
                identifier: { $ne: identifier },
            })
            expect(unregisteredOfficeProfileMock.updateOne).toHaveBeenCalledWith({ identifier }, { profile }, { upsert: true })
        })
    })

    describe('method: `removeUnregisteredProfile`', () => {
        it('should successfully remove unregistered profile', async () => {
            jest.spyOn(unregisteredOfficeProfileMock, 'deleteOne').mockResolvedValueOnce(true)

            await unregisteredOfficeProfile.removeUnregisteredProfile(identifier)

            expect(unregisteredOfficeProfileMock.deleteOne).toHaveBeenCalledWith({ identifier })
        })
    })

    describe('method: `getUnregisteredProfile`', () => {
        it('should successfully get unregistered profile', async () => {
            jest.spyOn(unregisteredOfficeProfileMock, 'findOne').mockResolvedValueOnce({ profile })

            expect(await unregisteredOfficeProfile.getUnregisteredProfile(identifier)).toMatchObject(profile)

            expect(unregisteredOfficeProfileMock.findOne).toHaveBeenCalledWith({ identifier })
        })
    })
})
