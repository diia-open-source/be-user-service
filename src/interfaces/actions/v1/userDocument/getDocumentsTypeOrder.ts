import { DocumentTypeCamelCase, UserActionArguments } from '@diia-inhouse/types'

export type CustomActionArguments = UserActionArguments

export interface ActionResult {
    documentsTypeOrder: DocumentTypeCamelCase[]
}
