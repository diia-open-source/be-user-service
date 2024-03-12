import { ActRecordRequestType } from '@src/generated'

export enum ActionType {
    MarriageRecord = 'marriage_record',
    DivorceRecord = 'divorce_record',
    BirthCertificate = 'birth_certificate',
    ChangeNameRecord = 'change_name_record',
    ChangeUseDocPhoto = 'change_use_doc_photo',
    ToChangeNameRecords = 'to_change_name_records',
    UserBirthRecord = 'user_birth_record',
    Family = 'family',
    ForceUpdate = 'force_update',
}

export enum DedicatedActRecord {
    UserBirthRecord = 'userBirthRecord',
}

export type ActRecordStrategyType = ActRecordRequestType | DedicatedActRecord
