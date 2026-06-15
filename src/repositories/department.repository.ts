import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'

export default class DepartmentRepository {
  schema: string = 'ecommerce.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  // Naming done by using CRUDL; create, read, update, delete and list
  async list(token: string, usercode: string /* user_id?: string, */): Promise<any[]> {
    const r = new sql.Request(this._pool)
    // r.input('user_id', sql.Int, user_id)
    r.input('token', sql.VarChar, token)
    r.input('usercode', sql.Int, usercode)
    const result = await r.execute(this.schema + 'usp_getDepartments').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return []

    this._logger.debug({ result }, `Executing procedure ${this.schema}usp_getDepartments result`)

    return result.recordset.length > 0 ? result.recordset : []
  }

  async create(token: string, usercode: string, department: any /* user_id?: string, */): Promise<boolean> {
    const r = new sql.Request(this._pool)
    // r.input('user_id', sql.Int, user_id)
    r.input('token', sql.VarChar, token)
    r.input('usercode', sql.Int, usercode)
    r.input('data_name', sql.VarChar, department.name)
    const result = await r.execute(this.schema + 'usp_createDepartment').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug({ result }, `Executing procedure ${this.schema}usp_createDepartment result`)

    return result.rowsAffected[0] > 0
  }

  async update(token: string, usercode: string, id: number, department: any /* user_id?: string, */): Promise<boolean> {
    const r = new sql.Request(this._pool)
    // r.input('user_id', sql.Int, user_id)
    r.input('token', sql.VarChar, token)
    r.input('usercode', sql.Int, usercode)
    r.input('id', sql.Int, id)
    r.input('data_name', sql.VarChar, department.name)
    const result = await r.execute(this.schema + 'usp_updateDepartment').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug({ result }, `Executing procedure ${this.schema}usp_updateDepartment result`)

    return result.rowsAffected[0] > 0
  }

  async delete(token: string, usercode: string, id: number /* user_id?: string, */): Promise<boolean> {
    const r = new sql.Request(this._pool)
    // r.input('user_id', sql.Int, user_id)
    r.input('token', sql.VarChar, token)
    r.input('usercode', sql.Int, usercode)
    r.input('id', sql.Int, id)
    const result = await r.execute(this.schema + 'usp_deleteDepartment').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug({ result }, `Executing procedure ${this.schema}usp_deleteDepartment result`)

    return result.rowsAffected[0] > 0
  }

  async updateProducts(token: string, usercode: string, id: number, product_id: number, mode: 'add' | 'remove'): Promise<boolean> {
    const r = new sql.Request(this._pool)
    // r.input('user_id', sql.Int, user_id)
    r.input('token', sql.VarChar, token)
    r.input('usercode', sql.Int, usercode)
    r.input('id', sql.Int, id)
    r.input('mode', sql.VarChar, mode)
    r.input('product_id', sql.Int, product_id)
    const result = await r.execute(this.schema + 'usp_updateDepartmentProducts').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug({ result }, `Executing procedure ${this.schema}usp_updateDepartmentProducts result`)

    return result.rowsAffected[0] > 0
  }
}
