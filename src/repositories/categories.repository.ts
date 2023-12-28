import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Categories {
  schema: string = 'ecommerce.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async getTree(usercode?: number, user_id?: string, culture: string = 'nl') {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    if (usercode)
      r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    const result = await r.execute(this.schema + 'usp_getCategoriesTree')

    if (result.recordset.length > 0)
      return result.recordset[0]
    return undefined
  }
}