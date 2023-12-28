import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sql from 'mssql'

import Ecommerce from '../repositories/ecommerce.repository'

declare module 'fastify' {
  export interface FastifyInstance {
    getSqlPool: (name?: string) => Promise<sql.ConnectionPool>
  }

  export interface FastifyReply {
    success: (data?: any, code?: number, executionTime?: number) => FastifyReply
    fail: (data?: any, code?: number, executionTime?: number) => FastifyReply
    error: (message?: string, code?: number, executionTime?: number) => FastifyReply
  }
}

export default async function (fastify: FastifyInstance) {
  fastify.get('', async function (request: FastifyRequest<{
    Querystring: {
      userCode?: number
    }
  }>, reply: FastifyReply) {
    try {
      if (!request.query.userCode || isNaN(+request.query.userCode))
        return reply.fail({ userCode: 'supplied value is invalid' })

      const pool = await fastify.getSqlPool()
      const repo = new Ecommerce(request.log, pool)
      // const userInfo = await repo.getUsercodeInfo(+request.query.userCode)

      const news = await repo.getDashboardNewsItems(+request.query.userCode)
      const result = await repo.getDashboardProducts(+request.query.userCode)

      request.log.debug({ result }, 'we received a response from db!')

      return reply.success({
        news,
        spotlight: result.spotlight,
        recent: result.recent,
        newP: result.newP,
        bestSelling: result.bestSelling,
        favorites: result.favorites
      })
    } catch (err) {
      request.log.error({ err }, 'error while retrieving dashboard page')
      return reply.error(err?.message)
    }
  })
}