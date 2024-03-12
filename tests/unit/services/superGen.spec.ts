import { MoleculerService } from '@diia-inhouse/diia-app'

import { IdentifierService } from '@diia-inhouse/crypto'
import { mockInstance } from '@diia-inhouse/test'
import { ActionVersion, EResidentTokenData, IdentityDocumentType, SessionType } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import SuperGenService from '@services/superGen'

import SessionGenerator from '@tests/mocks/sessionGenerator'

import { DiiaIdAgreementGenerationData, EResidentDiiaIdAgreementGenerationData } from '@interfaces/services/diiaId'
import { IdentityDocument } from '@interfaces/services/documents'
import { GenerationResult } from '@interfaces/services/superGen'

describe(`Service ${SuperGenService.name}`, () => {
    const identifier = new IdentifierService({ salt: 'salt' })
    const userSessionGenerator = new SessionGenerator(identifier)

    let mockMoleculerService: MoleculerService
    let superGenService: SuperGenService

    beforeEach(() => {
        mockMoleculerService = mockInstance(MoleculerService)
        superGenService = new SuperGenService(mockMoleculerService)
    })

    describe('method: `generateDiiaIdAgreement`', () => {
        it('should return diia id agreement file', async () => {
            const { user } = userSessionGenerator.getUserSession()
            const document = <DiiaIdAgreementGenerationData>{}
            const result: GenerationResult = { file: 'file' }

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(result)

            expect(await superGenService.generateDiiaIdAgreement(user, document)).toBe(result.file)
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'SuperGen',
                {
                    name: 'generateDiiaIdAgreement',
                    actionVersion: ActionVersion.V2,
                },
                {
                    params: { document },
                    session: utils.makeSession(user),
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `generateEResidentDiiaIdAgreement`', () => {
        it('should return e-resident diia id agreement file', async () => {
            const { user } = userSessionGenerator.getUserSession()

            const localUser: EResidentTokenData = { ...user, sessionType: SessionType.EResident }

            const document = <EResidentDiiaIdAgreementGenerationData>{}
            const result: GenerationResult = { file: 'file' }

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(result)

            expect(await superGenService.generateEResidentDiiaIdAgreement(localUser, document)).toBe(result.file)
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'SuperGen',
                {
                    name: 'generateEResidentDiiaIdAgreement',
                    actionVersion: ActionVersion.V2,
                },
                {
                    params: { document },
                    session: utils.makeSession(localUser),
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `generatePassport`', () => {
        it('should return passport file', async () => {
            const { user } = userSessionGenerator.getUserSession()
            const passport = <IdentityDocument>{}
            const result: GenerationResult = { file: 'file' }

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(result)

            expect(await superGenService.generatePassport(user, passport)).toBe(result.file)
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'SuperGen',
                {
                    name: 'generatePassport',
                    actionVersion: ActionVersion.V1,
                },
                {
                    params: { passport },
                    session: utils.makeSession(user),
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `generateEResidentPassport`', () => {
        it('should return e-resident passport file', async () => {
            const { user } = userSessionGenerator.getUserSession()

            const localUser: EResidentTokenData = { ...user, sessionType: SessionType.EResident }

            const passport = <IdentityDocument>{}
            const result: GenerationResult = { file: 'file' }

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(result)

            expect(await superGenService.generateEResidentPassport(localUser, passport)).toBe(result.file)
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'SuperGen',
                {
                    name: 'generateEResidentPassport',
                    actionVersion: ActionVersion.V1,
                },
                {
                    params: { passport },
                    session: utils.makeSession(localUser),
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })

    describe('method: `generateResidencePermit`', () => {
        it('should return residence permit file', async () => {
            const { user } = userSessionGenerator.getUserSession()
            const residencePermit = <IdentityDocument>{
                identityType: IdentityDocumentType.ResidencePermitPermanent,
                docNumber: 'docNumber',
                lastNameUA: 'lastNameUA',
                firstNameUA: 'firstNameUA',
                firstNameEN: 'firstNameEN',
                lastNameEN: 'lastNameEN',
                photo: 'photo',
                sign: 'sign',
                recordNumber: 'recordNumber',
            }
            const result: GenerationResult = { file: 'file' }

            jest.spyOn(mockMoleculerService, 'act').mockResolvedValueOnce(result)

            expect(await superGenService.generateResidencePermit(user, residencePermit)).toBe(result.file)
            expect(mockMoleculerService.act).toHaveBeenCalledWith(
                'SuperGen',
                {
                    name: 'generateResidencePermit',
                    actionVersion: ActionVersion.V1,
                },
                {
                    params: { residencePermit },
                    session: utils.makeSession(user),
                },
            )
            expect(mockMoleculerService.act).toHaveBeenCalledTimes(1)
        })
    })
})
