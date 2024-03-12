import { Document } from 'mongoose'

import { PlatformType } from '@diia-inhouse/types'

export interface EResidentDevice {
    mobileUid: string
    userIdentifier?: string
    platformType: PlatformType
    platformVersion: string
}

export interface EResidentDeviceModel extends EResidentDevice, Document {}
