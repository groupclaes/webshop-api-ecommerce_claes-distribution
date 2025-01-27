import sql from 'mssql'
import { FastifyBaseLogger } from 'fastify'
const config = require('./config')
const fetch = require('httpntlm')

export default class OldReportRepository {
  schema: string = 'ecommerce.'
  _logger: FastifyBaseLogger
  _pool: sql.ConnectionPool

  constructor(logger: FastifyBaseLogger, pool: sql.ConnectionPool) {
    this._logger = logger
    this._pool = pool
  }

  async getAll(userCode: number, customerId: number, addressId: number): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const request = new sql.Request(this._pool)
        request.input('userCode', sql.Int, userCode)
        request.input('customerId', sql.Int, customerId)
        request.input('addressId', sql.Int, addressId)
        const result = await request.execute(`GetReports`)

        if (result.recordset.length > 0) {
          const reports = result.recordset

          resolve(reports.map(report => ({
            id: report.id,
            name: {
              nl: report['name.nl'],
              fr: report['name.fr']
            },
            modes: {
              download: report['modes.download'],
              mail: report['modes.mail']
            },
            extensions: [
              report['extensions.pdf'] ? 'pdf' : null,
              report['extensions.xls'] ? 'xls' : null
            ].filter(e => e != null)
          })))
        } else {
          const { error } = result.recordsets[1][0]
          reject(new Error(error))
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  async getRecent(userCode: number): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const request = new sql.Request(this._pool)
        request.input('userCode', sql.Int, userCode)
        const result = await request.execute(`GetRecentReports`)

        if (result.recordset.length > 0) {
          const reports = result.recordset

          resolve(reports.map(report => ({
            id: report.id.toLowerCase(),
            name: report.filename,
            mode: {
              download: report['modes.download'],
              mail: report['modes.mail']
            },
            executionTime: report.executionTime,
            completionTime: report.completionTime,
            progress: report.progress
          })))
        } else {
          const { error } = result.recordsets[1][0]
          if (error) {
            reject(new Error(error))
          }
          resolve([])
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  async queueReport(id, mode, type, userCode, customerId, addressId, culture): Promise<{ uuid: string, uri: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const request = new sql.Request(this._pool)
        request.input('id', sql.Int, id)
        request.input('mode', sql.VarChar, mode)
        request.input('type', sql.VarChar, type)
        request.input('userCode', sql.Int, userCode)
        request.input('customerId', sql.Int, customerId)
        request.input('addressId', sql.Int, addressId)
        request.input('culture', sql.VarChar, culture)
        const result = await request.execute(`QueueReport`)
        if (result.recordset.length > 0) {
          const report = result.recordset[0]
          resolve({
            uuid: report.uuid.toLowerCase(),
            uri: report.uri
          })
        } else {
          const { error } = result.recordsets[1][0]
          if (error) {
            reject(new Error(error))
          }
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  async getQueuedReport(uuid, userCode): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const request = new sql.Request(this._pool)
        request.input('uuid', sql.UniqueIdentifier, uuid)
        request.input('userCode', sql.Int, userCode)
        const result = await request.execute(`GetQueuedReport`)
        if (result.recordset.length > 0) {
          const report = result.recordset[0]
          resolve({
            filename: report.filename,
            content: report.content,
            mimeType: report.mimeType,
            size: report.size,
            completionTime: report.completionTime
          })
        } else {
          const { error } = result.recordsets[1][0]
          if (error) {
            reject(new Error(error))
          }
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  async getQueuedReportStatus(uuid, userCode) {
    return new Promise(async (resolve, reject) => {
      try {
        const request = new sql.Request(this._pool)
        request.input('uuid', sql.UniqueIdentifier, uuid)
        request.input('userCode', sql.Int, userCode)
        const result = await request.execute(`GetQueuedReportStatus`)
        if (result.recordset.length > 0) {
          const report = result.recordset[0]
          resolve({
            success: report.message === 'Ok'
          })
        } else {
          const { error } = result.recordsets[1][0]
          if (error) {
            reject(new Error(error))
          }
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  async deleteQueuedReport(uuid, userCode) {
    return new Promise(async (resolve, reject) => {
      try {
        const request = new sql.Request(this._pool)
        request.input('uuid', sql.UniqueIdentifier, uuid)
        request.input('userCode', sql.Int, userCode)
        const result = await request.execute(`DeleteQueuedReport`)
        if (result.recordset.length > 0) {
          const report = result.recordset[0]
          resolve({
            success: report.message === 'Ok'
          })
        } else {
          const { error } = result.recordsets[1][0]
          if (error) {
            reject(new Error(error))
          }
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  async startQueuedJob(uuid, uri) {
    return new Promise(async (resolve, reject) => {
      try {
        fetch.get({
          url: uri,
          username: config.ssrs.username,
          password: config.ssrs.password,
          workstation: config.ssrs.workstation,
          domain: config.ssrs.domain,
          binary: true
        }, async (err, res) => {
          if (err) {
            console.error(err)
            reject(err)
            return
          }

          if (res.statusCode !== 200) {
            reject('statuscode was: ' + res.statusCode)
            console.error('statuscode was: ' + res.statusCode, uri)
            return
          }

          /** @type {Buffer} file */
          const file = res.body

          const request = new sql.Request(this._pool)
          request.input('uuid', sql.UniqueIdentifier, uuid)
          request.input('content', sql.VarBinary, file)
          request.input('mimeType', sql.VarChar, res.headers['content-type'])
          request.input('size', sql.Int, file.length)
          const result = await request.execute(`UpdateQueuedReportContent`)
          if (result.recordset.length > 0) {
            const report = result.recordset[0]
            resolve({
              success: report.message === 'Ok'
            })
          } else {
            const { error } = result.recordsets[1][0]
            if (error) {
              reject(new Error(error))
            }
          }
        })
      } catch (err) {
        reject(err)
      }
    })
  }
}