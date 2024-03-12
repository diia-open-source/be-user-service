import { Document } from 'mongoose'

import { ActionAccessType } from '@interfaces/services/userActionAccess'

export interface UserActionAccessSetting {
    actionAccessType: ActionAccessType
    expirationTime: number
    maxValue: number
}

export interface UserActionAccessSettingModel extends UserActionAccessSetting, Document {}
