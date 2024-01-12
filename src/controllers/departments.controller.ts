import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import sql from 'mssql'

import DepartmentRepository from '../repositories/department.repository'

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
   * Get all departments for current user
   * @route GET /api/{APP_VERSION}/ecommerce/departments
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
      const repo = new DepartmentRepository(request.log, pool)
      const usercode = +request.query.usercode
      const culture = request.query.culture ?? 'nl'

      request.log.debug({}, 'fetching departments')
      const data = await repo.list(usercode, request.jwt.sub, culture)

      request.log.debug({ departments_length: data?.length }, 'fetched departments')
      return reply.success(data)
    } catch (err) {
      request.log.error({ err }, 'Failed to fetch departments from database')
      return reply.error('failed to fetch departments from database')
    }
  })

  /**
   * Get all departments for current user
   * @route POST /api/{APP_VERSION}/ecommerce/departments
   */
  fastify.post('', async (request: FastifyRequest<{
    Querystring: {
      usercode: number
    }, Body: {
      name: string
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const usercode = +request.query.usercode
      const department = request.body

      request.log.debug({}, 'create department')
      const data = await repo.create(usercode, department, request.jwt.sub)
      return reply.success(data)
    } catch (err) {
      request.log.error({ err }, 'Failed to create department in database')
      return reply.error('failed to fetch create in database')
    }
  })

  /**
   * Get all departments for current user
   * @route PUT /api/{APP_VERSION}/ecommerce/departments/:id
   */
  fastify.put('/:id', async (request: FastifyRequest<{
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
      const repo = new DepartmentRepository(request.log, pool)
      const id = request.params.id
      const usercode = +request.query.usercode
      const department = request.body

      request.log.debug({}, 'update department')
      const data = await repo.update(usercode, id, department, request.jwt.sub)
      return reply.success(data)
    } catch (err) {
      request.log.error({ err }, 'Failed to update department in database')
      return reply.error('failed to fetch update in database')
    }
  })

  /**
   * Delete department with user
   * @route DELETE /api/{APP_VERSION}/ecommerce/departments/:id
   */
  fastify.delete('/:id', async (request: FastifyRequest<{
    Params: {
      id: number
    }, Querystring: {
      usercode: number
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const id = request.params.id
      const usercode = +request.query.usercode
      const department = request.body

      request.log.debug({}, 'delete department')
      const data = await repo.update(usercode, id, department, request.jwt.sub)
      return reply.success(data)
    } catch (err) {
      request.log.error({ err }, 'Failed to delete department in database')
      return reply.error('failed to fetch delete in database')
    }
  })
}