import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import sql from 'mssql'

import Dashboard from '../repositories/dashboard.repository'

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
      usercode: number
      culture?: string
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new Dashboard(request.log, pool)
      const culture = request.query.culture ?? 'nl'

      const user = await repo.getUserInfo(request.jwt.sub)
      let canViewPrices = false
      // if (user)
      //   canViewPrices = user.user_type === 2 || user.user_type === 3
      // all users can view prices
      canViewPrices = true

      const dashboard: any[] | undefined = await repo.get(request.query.usercode, request.jwt.sub, culture)

      if (!dashboard)
        return reply.success(undefined, 204)

      const blocks = dashboard.map(x => x[0])
      if (!canViewPrices) {
        for (const list of blocks) {
          if (!list.products) continue
          for (const product of list.products) {
            product.prices?.forEach(price => {
              price.base = 0
              delete price.amount
              delete price.discount
              delete price.quantity
            })
          }
        }
      }

      return reply.success({ blocks })
    } catch (err) {
      request.log.error({ error: err }, 'failed to get dashboard')
      return reply.error('failed to get dashboard')
    }
  })
}