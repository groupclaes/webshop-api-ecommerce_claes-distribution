export function createECSEvent(category: ECSEventCategory[], action: string, dataset: string, type: ECSEventType[] = ['access']): IECSEvent {
  return {
    kind: 'event',
    action,
    category,
    type,
    dataset,
    severity: 5,
    outcome: 'unknown'
  }
}

export function createSqlECSEvent(action: string, type: ECSEventType[] = ['access']): IECSEvent {
  return createECSEvent(['database'], action, 'mssql.access', type)
}

export function createOpenedgeECSEvent(action: string, type: ECSEventType[] = ['access']): IECSEvent {
  return createECSEvent(['database'], action, 'openedge.access', type)
}

export interface IECS {
  event?: IECSEvent
}

export interface IECSEvent {
  id?: string
  dataset?: string
  module?: string
  kind: ECSEventKind,
  category: ECSEventCategory[]
  type: ECSEventType[]
  outcome: ECSEventOutcome
  action: string
  severity: ECSEventSeverity
}

export type ECSEventKind = 'alert' | 'asset' | 'enrichment' | 'event' | 'metric' | 'state' | 'pipeline_error' | 'signal'
export type ECSEventCategory = 'api' | 'authentication' | 'configuration' | 'database' | 'driver' | 'email' | 'file' | 'host' | 'iam' | 'intrusion_detection' | 'library' | 'malware' | 'network' | 'package' | 'process' | 'registry' | 'session' | 'threat' | 'vulnerability' | 'web'
export type ECSEventType = 'access' | 'admin' | 'allowed' | 'change' | 'connection' | 'creation' | 'deletion' | 'denied' | 'end' | 'error' | 'group' | 'indicator' | 'info' | 'installation' | 'protocol' | 'start' | 'user'
export type ECSEventOutcome = 'failure' | 'success' | 'unknown'
export enum ECSEventSeverity {
  Emergency = 0,
  Alert = 1,
  Critical = 2,
  Error = 3,
  Warning = 4,
  Notice = 5,
  Informational = 6,
  Debug = 7
}
