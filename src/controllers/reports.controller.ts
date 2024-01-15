import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import sql from 'mssql'
import fetch from 'httpntlm'

import ReportRepository from '../repositories/report.repository'

declare module 'fastify' {
  export interface FastifyInstance {
    getSqlPool: (name?: string) => Promise<sql.ConnectionPool>
  }

  export interface FastifyRequest {
    jwt: JWTPayload
    hasRole: (role: string) => boolean
    hasPermission: (permission: string, scope?: string) => boolean
  }

  export interface FastifyReply {
    success: (data?: any, code?: number, executionTime?: number) => FastifyReply
    fail: (data?: any, code?: number, executionTime?: number) => FastifyReply
    error: (message?: string, code?: number, executionTime?: number) => FastifyReply
  }
}

export default async function (fastify: FastifyInstance) {
  /**
   * Get a list of all available reports the current user can request
   * @route GET /api/{APP_VERSION}/ecommerce/reports
   */
  fastify.get('', async (request: FastifyRequest<{
    Querystring: {
      usercode: number
      culture?: string
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new ReportRepository(request.log, pool)
      const usercode = +request.query.usercode
      const culture = request.query.culture ?? 'nl'

      request.log.debug({}, 'fetching reports')
      const data = await repo.list(usercode, request.jwt.sub, culture)

      request.log.debug({ reports_length: data?.length }, 'fetched reports')
      return reply.success(data)
    } catch (err) {
      request.log.error({ err }, 'Failed to fetch reports from database')
      return reply.error('failed to fetch reports from database')
    }
  })

  /**
   * Get a list of all reports requested by the current user in tha last x days
   * @route GET /api/{APP_VERSION}/ecommerce/reports/list
   */
  fastify.get('/list', async (request: FastifyRequest<{
    Querystring: {
      usercode: number
      culture?: string
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new ReportRepository(request.log, pool)
      const usercode = +request.query.usercode
      const culture = request.query.culture ?? 'nl'

      request.log.debug({}, 'fetching requested reports history')
      const data = await repo.listRecent(usercode, request.jwt.sub, culture)

      request.log.debug({ reports_length: data?.length }, 'fetched requested reports history')
      return reply.success(data)
    } catch (err) {
      request.log.error({ err }, 'Failed to fetch requested reports history from database')
      return reply.error('failed to fetch requested reports history from database')
    }
  })

  /**
   * Get a queued report result, when the report is still being processed return 4xx code 
   * @route GET /api/{APP_VERSION}/ecommerce/reports/queue/:uuid
   */
  fastify.get('/queue/:uuid', async (request: FastifyRequest<{
    Params: {
      uuid: string
    }, Querystring: {
      usercode: number
      culture?: string
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new ReportRepository(request.log, pool)
      const uuid = request.params.uuid
      const usercode = +request.query.usercode
      const culture = request.query.culture ?? 'nl'

      request.log.debug({}, 'fetching queued report')
      const data = await repo.readQueuedReport(usercode, uuid, request.jwt.sub, culture)

      request.log.debug({ reports_length: data?.length }, 'fetched queued report')
      if (data.complete) {
        return reply
          .code(200)
          .header('Content-disposition', 'attachment; filename*=UTF-8\'\'' + encodeURI(data.filename))
          .type(data.mimeType)
          .send(data.content)
      }
      return reply.fail({ progress: 'The requested report is not available yet.'})
    } catch (err) {
      request.log.error({ err }, 'Failed to fetch queued report from database')
      return reply.error('failed to fetch rqueued report from database')
    }
  })

  /**
   * Request a report to be queued
   * @route POST /api/{APP_VERSION}/ecommerce/reports/:id/queue
   */
  fastify.get('/queue', async (request: FastifyRequest<{
    Params: {
      id: number
    }, Querystring: {
      usercode: number
    }, Body: {
      name: string
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new ReportRepository(request.log, pool)
      const usercode = +request.query.usercode
      const department = request.body

      request.log.debug({}, 'queue report')
      // const data = await repo.createQueuedReport(usercode, department, request.jwt.sub)
      // return reply.success(data)
    } catch (err) {
      request.log.error({ err }, 'Failed to create department in database')
      return reply.error('failed to fetch create in database')
    }
  })

  /**
   * Delete department with user
   * @route DELETE /api/{APP_VERSION}/ecommerce/reports/queue/:uuid
   */
  fastify.delete('/queue/:uuid', async (request: FastifyRequest<{
    Params: {
      uuid: string
    }, Querystring: {
      usercode: number
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new ReportRepository(request.log, pool)
      const uuid = request.params.uuid
      const usercode = +request.query.usercode

      request.log.debug({}, 'delete department')
      const data = await repo.deleteQueuedReport(usercode, uuid, request.jwt.sub)
      return reply.success(data)
    } catch (err) {
      request.log.error({ err }, 'Failed to delete department in database')
      return reply.error('failed to fetch delete in database')
    }
  })
}