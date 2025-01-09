import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import sql from 'mssql'

import Dashboard from '../repositories/dashboard.repository'

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
      const dashboard: any[] | undefined = await repo.get(request.query.usercode, request.jwt.sub, culture)

      if (!dashboard)
        return reply.success(undefined, 204)

      const blocks = dashboard.map(x => x[0])
      if (user === undefined || !user?.can_view_prices) {
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
