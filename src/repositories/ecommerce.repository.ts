import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class Ecommerce {
  schema: string = '[ecommerce].'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async getUsercodeInfo(usercode: number): Promise<any | undefined> {
    const r = new sql.Request(this._pool)
    r.input('usercode', sql.Int, usercode)
    const o = await r.query('SELECT CustomerId, AddressId FROM UserSettings WHERE UserCode = @usercode')
    return o.recordset.length > 0 ? o.recordset[0] : undefined
  }

  async getDashboardNewsItems(usercode: number): Promise<any[]> {
    const r = new sql.Request(this._pool)
    r.input('usercode', sql.Int, usercode)
    const o = await r.execute('usp_getDashboardNewsItems')
    return o.recordset.length > 0 ? o.recordset[0] ?? [] : []
  }

  async getDashboardProducts(usercode: number): Promise<any> {
    const r = new sql.Request(this._pool)
    r.input('usercode', sql.Int, usercode)
    const o = await r.execute('usp_getDashboardProducts')
    return {
      spotlight: o.recordsets.length > 0 ? o.recordsets[0][0] ?? [] : [],
      recent: o.recordsets.length > 1 ? o.recordsets[1][0] ?? [] : [],
      bestSelling: o.recordsets.length > 2 ? o.recordsets[2][0] ?? [] : [],
      newP: o.recordsets.length > 3 ? o.recordsets[3][0] ?? [] : [],
      favorites: o.recordsets.length > 4 ? o.recordsets[4][0] ?? [] : []
    }
  }
}