import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class ReportRepository {
  schema: string = 'ecommerce.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async list(usercode: number, user_id?: string, culture: string = 'nl'): Promise<any[]> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    const result = await r.execute(this.schema + 'usp_getReports').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return []

    this._logger.debug({ result }, `Exeecuting procedure ${this.schema}usp_getReports result`)

    return result.recordset.length > 0 ? result.recordset[0] : []
  }

  async listRecent(usercode: number, user_id?: string, culture: string = 'nl'): Promise<any[]> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    const result = await r.execute(this.schema + 'usp_getRecentReports').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return []

    this._logger.debug({ result }, `Exeecuting procedure ${this.schema}usp_getRecentReports result`)

    return result.recordset.length > 0 ? result.recordset[0] : []
  }

  async createQueuedReport(usercode: number, id: number, mode: string, type: string, user_id?: string, culture: string = 'nl'): Promise<boolean> {

  }

  async readQueuedReport(usercode: number, uuid: string, user_id?: string, culture: string = 'nl'): Promise<any> {

  }

  async deleteQueuedReport(usercode: number, uuid: string, user_id?: string, culture: string = 'nl'): Promise<any> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('uuid', sql.VarChar, uuid)
    r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    const result = await r.execute(this.schema + 'usp_deleteQueuedReport').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug({ result }, `Exeecuting procedure ${this.schema}usp_deleteQueuedReport result`)

    return result.rowsAffected[0] > 0
  }

  async updateQueuedReport(uuid: string, content: any, mimeType: string, size: number): Promise<boolean> {
    const r = new sql.Request(this._pool)
    r.input('uuid', sql.UniqueIdentifier, uuid)
    r.input('content', sql.VarBinary, content)
    r.input('mimeType', sql.VarChar, mimeType)
    r.input('size', sql.Int, size)
    const result = await r.execute(this.schema + 'usp_updateQueuedReport').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug({ result }, `Exeecuting procedure ${this.schema}usp_updateQueuedReport result`)

    return result.rowsAffected[0] > 0
  }
}

