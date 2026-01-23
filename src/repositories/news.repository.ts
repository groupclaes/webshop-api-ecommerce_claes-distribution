import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

const SCHEMA: string = 'ecommerce.'

export class NewsRepository {
  private readonly _logger: FastifyBaseLogger
  private readonly _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger.child({ repository: 'NewsRepository' })
    this._pool = pool
  }

  async list(token: string, usercode?: string, /* user_id?: string, */culture: string = 'nl'): Promise<any[]> {
    const r = this._pool.request()
    r.input('usercode', sql.Int, usercode)
    // r.input('user_id', sql.Int, user_id)
    r.input('token', sql.VarChar, token)
    r.input('culture', sql.VarChar, culture)

    const result = await r.execute(SCHEMA + 'usp_getNews')

    if (result.recordset.length > 0) {
      this._logger.debug({ row_count: result.recordset[0].length }, 'Rows returned from procedure.')
      return result.recordset[0] as any[]
    }
    return undefined
  }

  async read(token: string, id: number, usercode?: string, /* user_id?: string, */culture: string = 'nl'): Promise<any[]> {
    const r = this._pool.request()
    r.input('usercode', sql.Int, usercode)
    // r.input('user_id', sql.Int, user_id)
    r.input('token', sql.VarChar, token)
    r.input('culture', sql.VarChar, culture)
    r.input('id', sql.Int, id)
    const result = await r.execute(SCHEMA + 'usp_getNews')

    if (result.recordset.length > 0) {
      this._logger.debug({ row_count: result.recordset.length }, 'Rows returned from procedure.')
      return result.recordset as any[]
    }
    return undefined
  }


}
