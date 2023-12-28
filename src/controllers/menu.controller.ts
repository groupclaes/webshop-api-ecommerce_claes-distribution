import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import sql from 'mssql'

import Categories from '../repositories/categories.repository'

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
  fastify.get('', async (request: FastifyRequest<{
    Querystring: {
      usercode?: number
      culture?: string
    }
  }>, reply: FastifyReply) => {
    try {
      const repo = new Categories()
      const culture = request.query.culture ?? 'nl'

      const data = await repo.getTree(request.query.usercode, request.jwt?.sub, culture)
      return reply.success(data)
    } catch (err) {
      return reply.error('failed to get categories tree from database')
    }
  })
}