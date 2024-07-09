import { MoleculerService } from '@diia-inhouse/diia-app'

import { IdentifierService } from '@diia-inhouse/crypto'
import { mockInstance } from '@diia-inhouse/test'
import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import DocumentsService from '@services/documents'

import { documentsDocServiceClient } from '@tests/mocks/grpc/clients'
import SessionGenerator from '@tests/mocks/sessionGenerator'

import { AppConfig } from '@interfaces/config'
import { IdentityDocument, Passport } from '@interfaces/services/documents'

describe(`Service ${DocumentsService.name}`, () => {
    const identifier = new IdentifierService({ salt: 'salt' })
    const userSessionGenerator = new SessionGenerator(identifier)

    let mockMoleculerService: MoleculerService
    let documentsService: DocumentsService

    beforeEach(() => {
        mockMoleculerService = mockInstance(MoleculerService)
        documentsService = new DocumentsService(
            <AppConfig>{ documents: { memoizeCacheTtl: 1 } },
            mockMoleculerService,
            documentsDocServiceClient,
            jest.fn(),
        )
    })

    describe('method: `getPassportToProcess`', () => {
        it('should return passport', async () => {
            const { user } = userSessionGenerator.getUserSession()
            const passport = <Passport>{
                docNumber: 'docNumber',
                lastNameUA: 'lastNameUA',
                firstNameUA: 'firstNameUA',
                middleNameUA: 'middleNameUA',
                photo: 'photo',
                sign: 'sign',
                countryCode: 'countryCode',
                recordNumber: 'recordNumber',
                type: 'ID',
            }

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(passport)

            expect(await documentsService.getPassportToProcess(user)).toMatchObject(passport)
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'Documents',
                {
                    name: 'getPassportToProcess',
                    actionVersion: ActionVersion.V1,
                },
                {
                    session: { sessionType: SessionType.User, user },
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `getIdentityDocument`', () => {
        it('should return identity document', async () => {
            const { user } = userSessionGenerator.getUserSession()
            const identityDocument = <IdentityDocument>{}

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(identityDocument)

            expect(await documentsService.getIdentityDocument(user)).toMatchObject(identityDocument)
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'Documents',
                {
                    name: 'getIdentityDocument',
                    actionVersion: ActionVersion.V1,
                },
                {
                    session: utils.makeSession(user),
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `expireDocument`', () => {
        it('should successfully execute method', async () => {
            const userIdentifier = 'userIdentifier'
            const documentType = 'birth-certificate'

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(null)

            await documentsService.expireDocument(userIdentifier, documentType)
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'Documents',
                { name: 'expireDocument', actionVersion: ActionVersion.V2 },
                { params: { userIdentifier, documentType } },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })
})
