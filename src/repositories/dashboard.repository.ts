import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Dashboard {
  schema: string = 'ecommerce.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async get(usercode: number, user_id?: string, culture: string = 'nl') {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    const result = await r.execute(this.schema + 'usp_getDashboard')

    if (result.recordset.length > 0) {
      return result.recordsets as any[]
    }
    return undefined
  }

  /**
   * SSO Get user details by ID
   * @param user_id 
   * @returns 
   */
  async getUserInfo(user_id?: string): Promise<undefined | any> {
    if (!user_id) return undefined

    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)

    const result = await r.execute(`sso.usp_getUserInfo`)

    if (result.recordset.length > 0) {
      return result.recordset[0][0]
    }
    return undefined
  }
}