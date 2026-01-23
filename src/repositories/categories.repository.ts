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
    const r = this._pool.request()
    r.input('user_id', sql.Int, user_id)
    if (usercode)
      r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    const result = await r.execute(this.schema + 'usp_getCategoriesTree')

    if (result.recordset.length > 0)
      return result.recordset[0]
    return undefined
  }

  async getLastModified() {
    const r = this._pool.request()
    const result = await r.query(`SELECT TOP(1) ModifiedOn as modified
                                  FROM [Category]
                                  ORDER BY ModifiedOn DESC`)
    if (result.recordset.length > 0) {
      return result.recordset[0].modified
    } else {
      const { error } = result.recordsets[1][0]
      throw new Error(error)
    }
  }

  async getIdsWithProducts(usercode: string, user_id: string, culture: string, query: string, oFavorites: boolean, oPromo: boolean, oNew: boolean, department?: number) {
    const r = this._pool.request()
    r.input('user_id', sql.Int, user_id)
    r.input('usercode', sql.Int, +usercode)
    r.input('culture', sql.VarChar, culture)
    r.input('query', sql.VarChar, query)
    r.input('oFavorites', sql.Bit, oFavorites)
    r.input('oPromo', sql.Bit, oPromo)
    r.input('oNew', sql.Bit, oNew)
    r.input('department', sql.Int, department)
    const result = await r.execute(this.schema + 'usp_getCategoriesWithProducts')

    const products = result.recordsets[0]
    const categories = result.recordsets[1]

    // this._logger.info({
    //   products,
    //   categories,
    //   params: r.parameters
    // }, 'products and categories from usp_getCategoriesWithProducts')

    return categories
      .filter(e => products.some(x => x.num1 === e.id || x.num2 === e.id || x.num3 === e.id || x.num4 === e.id))
      .map(e => e.id)
  }
}
