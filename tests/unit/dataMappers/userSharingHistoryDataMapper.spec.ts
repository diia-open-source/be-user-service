const momentFormatStub = jest.fn()

jest.mock('moment', () => (): unknown => ({ format: momentFormatStub }))

import { randomUUID } from 'crypto'

import { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'
import UserSharingHistoryDataMapper from '@dataMappers/userSharingHistoryDataMapper'

import { UserSharingHistoryItemModel } from '@interfaces/models/userSharingHistoryItem'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe('UserSharingHistoryDataMapper', () => {
    const userHistoryDataMapperMock = mockInstance(UserHistoryDataMapper)
    const userSharingHistoryDataMapper = new UserSharingHistoryDataMapper(userHistoryDataMapperMock)

    describe('method: `toEntity`', () => {
        it('should return valid history item', () => {
            const date = new Date()
            const model = <UserSharingHistoryItemModel>{
                acquirer: {
                    name: 'acquirer-name',
                    address: 'acquirer-address',
                },
                date,
                documents: [DocumentType.BirthCertificate],
                sharingId: randomUUID(),
                offer: {
                    name: 'offer-name',
                },
            }
            const {
                sharingId,
                acquirer: { address, name: aquirerName },
                offer,
            } = model

            momentFormatStub.mockReturnValueOnce(date.toISOString())
            jest.spyOn(userHistoryDataMapperMock, 'getStatus').mockReturnValueOnce(UserHistoryItemStatus.Done)
            jest.spyOn(userHistoryDataMapperMock, 'getDocumentName').mockReturnValueOnce('document-name')

            expect(userSharingHistoryDataMapper.toEntity(model)).toEqual({
                id: sharingId,
                status: UserHistoryItemStatus.Done,
                date: date.toISOString(),
                documents: ['document-name'],
                recipient: { address, name: aquirerName },
                purpose: offer!.name,
            })

            expect(userHistoryDataMapperMock.getStatus).toHaveBeenCalledWith(model)
            expect(userHistoryDataMapperMock.getDocumentName).toHaveBeenCalledWith(DocumentType.BirthCertificate)
        })
    })
})
