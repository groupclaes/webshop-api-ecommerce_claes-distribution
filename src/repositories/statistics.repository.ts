import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class StatisticsRepository {
  schema: string = 'ecommerce.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async add(payload: IStatisticPayload): Promise<boolean> {
    const r = new sql.Request(this._pool)
    r.input('event_id', sql.TinyInt, payload.ev)
    if (payload.uid)
      r.input('user_id', sql.Int, payload.uid)
    if (payload.pr1id)
      r.input('product_id', sql.Int, payload.pr1id)
    const result = await r.execute(this.schema + 'usp_addStatistic').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug(`Executing procedure ${this.schema}usp_addStatistic completed!`)
    return result.rowsAffected[0] > 0
  }
}

export interface IStatisticPayload {
  t: 'event' | 'page_view'
  ev: number // event id
  pr1id?: number // product 1 id
  uid?: string
}