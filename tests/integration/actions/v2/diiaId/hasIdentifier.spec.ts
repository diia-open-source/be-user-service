import { randomUUID as uuid } from 'node:crypto'

import { DateTime } from 'luxon'

import TestKit from '@diia-inhouse/test'

import HasIdentifierAction from '@actions/v2/diiaId/hasIdentifier'

import diiaIdModel from '@models/diiaId'

import { getApp } from '@tests/utils/getApp'

import { DiiaId, SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${HasIdentifierAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let action: HasIdentifierAction
    const testKit = new TestKit()

    beforeAll(async () => {
        app = await getApp()
        action = app.container.build(HasIdentifierAction)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return true if the user with identifier', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()

        const identifierMock = uuid()
        const userIdentifierMock = uuid()

        const diiaIdModelMock: DiiaId = {
            userIdentifier: userIdentifierMock,
            mobileUid: uuid(),
            identifier: identifierMock,
            signAlgo: SignAlgo.DSTU,
            isDeleted: false,
            creationDate: DateTime.now().toJSDate(),
            expirationDate: DateTime.now().plus({ days: 1 }).toJSDate(),
        }

        await diiaIdModel.create(diiaIdModelMock)

        // Act
        const result = await action.handler({
            params: { userIdentifier: userIdentifierMock },
            headers,
        })

        // Assert
        expect(result.hasDiiaIdIdentifierResult).toBe(true)

        // Cleanup
        await diiaIdModel.deleteOne({ identifier: identifierMock })
    })

    describe('mobileUidToExclude param', () => {
        it('should return true if the user with identifier in other device', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()

            const identifierMock = uuid()
            const userIdentifierMock = uuid()

            const diiaIdModelMock: DiiaId = {
                userIdentifier: userIdentifierMock,
                mobileUid: uuid(),
                identifier: identifierMock,
                signAlgo: SignAlgo.DSTU,
                isDeleted: false,
                creationDate: DateTime.now().toJSDate(),
                expirationDate: DateTime.now().plus({ days: 1 }).toJSDate(),
            }

            await diiaIdModel.create(diiaIdModelMock)

            // Act
            const result = await action.handler({
                params: { mobileUidToExclude: uuid(), userIdentifier: userIdentifierMock },
                headers,
            })

            // Assert
            expect(result.hasDiiaIdIdentifierResult).toBe(true)

            // Cleanup
            await diiaIdModel.deleteOne({ identifier: identifierMock })
        })

        it('should return false if the user with identifier in current device', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()

            const identifierMock = uuid()
            const userIdentifierMock = uuid()
            const mobileUidMock = uuid()

            const diiaIdModelMock: DiiaId = {
                userIdentifier: userIdentifierMock,
                mobileUid: mobileUidMock,
                identifier: identifierMock,
                signAlgo: SignAlgo.DSTU,
                isDeleted: false,
                creationDate: DateTime.now().toJSDate(),
                expirationDate: DateTime.now().plus({ days: 1 }).toJSDate(),
            }

            await diiaIdModel.create(diiaIdModelMock)

            // Act
            const result = await action.handler({
                params: { mobileUidToExclude: mobileUidMock, userIdentifier: userIdentifierMock },
                headers,
            })

            // Assert
            expect(result.hasDiiaIdIdentifierResult).toBe(false)

            // Cleanup
            await diiaIdModel.deleteOne({ identifier: identifierMock })
        })
    })

    describe('mobileUid param', () => {
        it('should return true if the user without identifier in current device', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()

            const identifierMock = uuid()
            const mobileUidMock = uuid()
            const userIdentifierMock = uuid()

            const diiaIdModelMock: DiiaId = {
                userIdentifier: userIdentifierMock,
                mobileUid: mobileUidMock,
                identifier: identifierMock,
                signAlgo: SignAlgo.DSTU,
                isDeleted: false,
                creationDate: DateTime.now().toJSDate(),
                expirationDate: DateTime.now().plus({ days: 1 }).toJSDate(),
            }

            await diiaIdModel.create(diiaIdModelMock)

            // Act
            const result = await action.handler({
                params: { mobileUid: mobileUidMock, userIdentifier: userIdentifierMock },
                headers,
            })

            // Assert
            expect(result.hasDiiaIdIdentifierResult).toBe(true)

            // Cleanup
            await diiaIdModel.deleteOne({ identifier: identifierMock })
        })

        it('should return false if the user without the identifier in current device', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()

            const identifierMock = uuid()
            const userIdentifierMock = uuid()

            const diiaIdModelMock: DiiaId = {
                userIdentifier: userIdentifierMock,
                mobileUid: uuid(),
                identifier: identifierMock,
                signAlgo: SignAlgo.DSTU,
                isDeleted: false,
                creationDate: DateTime.now().toJSDate(),
                expirationDate: DateTime.now().plus({ days: 1 }).toJSDate(),
            }

            await diiaIdModel.create(diiaIdModelMock)

            // Act
            const result = await action.handler({
                params: { mobileUid: uuid(), userIdentifier: userIdentifierMock },
                headers,
            })

            // Assert
            expect(result.hasDiiaIdIdentifierResult).toBe(false)

            // Cleanup
            await diiaIdModel.deleteOne({ identifier: identifierMock })
        })

        it('should return false if the user without the identifier', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()

            // Act
            const result = await action.handler({ params: { mobileUid: uuid(), userIdentifier: uuid() }, headers })

            // Assert
            expect(result.hasDiiaIdIdentifierResult).toBe(false)
        })

        it('should throw error if diiaid inactive', async () => {
            // Arrange
            const headers = testKit.session.getHeaders()

            const identifierMock = uuid()
            const mobileUidMock = uuid()
            const userIdentifierMock = uuid()

            const diiaIdModelMock: DiiaId = {
                userIdentifier: userIdentifierMock,
                mobileUid: mobileUidMock,
                identifier: identifierMock,
                signAlgo: SignAlgo.DSTU,
                isDeleted: false,
            }

            await diiaIdModel.create(diiaIdModelMock)

            // Assert
            await expect(async () => {
                await action.handler({
                    headers,
                    params: { mobileUid: mobileUidMock, userIdentifier: userIdentifierMock },
                })
            }).rejects.toThrow(Error)

            // Cleanup
            await diiaIdModel.deleteOne({ identifier: identifierMock })
        })
    })
})
