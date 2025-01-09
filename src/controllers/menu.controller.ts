import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import sql from 'mssql'

import Categories from '../repositories/categories.repository'

export default async function (fastify: FastifyInstance) {
  fastify.get('', async (request: FastifyRequest<{
    Querystring: {
      usercode?: number
      culture?: string
    }
  }>, reply: FastifyReply) => {
    const start = performance.now()

    try {
      const pool = await fastify.getSqlPool()
      const repo = new Categories(request.log, pool)
      const culture = request.query.culture ?? 'nl'

      const data = await repo.getTree(request.query.usercode, request.jwt?.sub, culture)
      return reply.success(data, 200, performance.now() - start)
    } catch (err) {
      return reply.error('failed to get categories tree from database')
    }
  })
}
