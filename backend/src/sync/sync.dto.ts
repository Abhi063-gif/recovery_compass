export interface SyncMutation {
  id: string;
  entity: 'medication_log' | 'symptom_log' | 'task_event' | 'asha_visit' | 'escalation';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  clientTimestamp: string;
}

export class SyncPushDto {
  mutations!: SyncMutation[];
  deviceId?: string;
  clientVersion?: string;
}

export class SyncPullQueryDto {
  since?: string;
  entityTypes?: string;
}
