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

  async list(usercode: number, user_id?: string, culture: string = 'nl'): Promise<any[]> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    const result = await r.execute(this.schema + 'usp_getDepartments').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return []

    this._logger.debug({ result }, `Exeecuting procedure ${this.schema}usp_getDepartments result`)

    return result.recordset.length > 0 ? result.recordset[0] : []
  }

  async create(usercode: number, department: any, user_id?: string, culture: string = 'nl'): Promise<boolean> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    r.input('department_name', sql.VarChar, department.name)
    const result = await r.execute(this.schema + 'usp_createDepartment').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug({ result }, `Exeecuting procedure ${this.schema}usp_createDepartment result`)

    return result.rowsAffected[0] > 0
  }

  async update(usercode: number, id: number, department: any, user_id?: string, culture: string = 'nl'): Promise<boolean> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    r.input('department_name', sql.VarChar, department.name)
    const result = await r.execute(this.schema + 'usp_updateDepartment').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug({ result }, `Exeecuting procedure ${this.schema}usp_updateDepartment result`)

    return result.rowsAffected[0] > 0
  }

  async delete(usercode: number, id: number, user_id?: string, culture: string = 'nl'): Promise<boolean> {
    const r = new sql.Request(this._pool)
    r.input('user_id', sql.Int, user_id)
    r.input('id', sql.Int, id)
    r.input('usercode', sql.Int, usercode)
    r.input('culture', sql.VarChar, culture)
    const result = await r.execute(this.schema + 'usp_deleteDepartment').catch(err => {
      this._logger.error({ err }, 'error while executing sql procedure')
    })

    if (!result)
      return false

    this._logger.debug({ result }, `Exeecuting procedure ${this.schema}usp_deleteDepartment result`)

    return result.rowsAffected[0] > 0
  }
}