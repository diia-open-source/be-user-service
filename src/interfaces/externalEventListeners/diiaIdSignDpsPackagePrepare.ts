export interface DiiaIdSignDpsPackagePrepareRequest {
    identifier: string
    registryUserIdentifier: string
    certificateSerialNumber: string
}

export interface TaxReportDao {
    fname: string
    contentBase64: string
}

export interface DiiaIdSignDpsPackagePrepareResponse {
    identifier: string
    inReportDaoArray: TaxReportDao[]
}
