import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

import Categories from '../repositories/categories.repository'
import { FastifyRedis } from '@fastify/redis'

const RESPONSE_MAX_AGE = 60 * 60 * 24

export default async function menuController(fastify: FastifyInstance) {
  fastify.get('', async function getMenu(request: FastifyRequest<{
    Querystring: {
      usercode?: number
      culture?: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()
    const date_key = new Date().toJSON().slice(0, 10)

    try {
      const redis: FastifyRedis = fastify.redis
      let cached_data: string
      try {
        cached_data = await redis.get(`menu-${date_key}`)
      } catch {
        request.log.warn('Failed to read from redis cache')
      }
      let data: any[] = []
      if (cached_data) {
        reply.header('claes-cache', 'hit')
        data = JSON.parse(cached_data)
      } else {
        reply.header('claes-cache', 'miss')
        const pool = await fastify.getSqlPool()
        const repo = new Categories(request.log, pool)
        data = await repo.getTree(request.query.usercode, request.jwt?.sub, request.query.culture ?? 'nl')
        try {
          redis.set(`menu-${date_key}`, JSON.stringify(data))
        } catch {
          request.log.warn('Failed to write to redis cache')
        }
      }

      reply
        .header('Cache-Control', `must-revalidate, max-age=${RESPONSE_MAX_AGE}, private`)
        .header('Expires', new Date(Date.now() + (RESPONSE_MAX_AGE * 1000)).toUTCString())
        .success(data, 200, performance.now() - start)
    } catch (err) {
      request.log.fatal({ err }, 'An unknown error has occurred while processing the request!')
      reply
        .error('An unknown error has occurred while processing the request!')
    }
  })

  fastify.get('/product-count', async function getProductCount(request: FastifyRequest<{
    Querystring: {
      usercode?: string
      culture?: string,
      query?: string
      oFavorites?: boolean
      oPromo?: boolean
      oNew?: boolean
      department?: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()
    const date_key = new Date().toJSON().slice(0, 10)

    try {
      const redis: FastifyRedis = fastify.redis

      const query = request.query.query ?? ''
      const o_promo = request.query.oPromo ?? false
      const o_favorites = request.query.oFavorites ?? false
      const o_new = request.query.oNew ?? false
      const department = request.query.department

      let cached_data: string
      if (query.trim().length === 0 && !o_promo && !o_favorites && !o_new && !department) {
        try {
          cached_data = await redis.get(`menu-product-count-${request.query.usercode ?? 0}-${date_key}`)
        } catch {
          request.log.warn('Failed to read from redis cache')
        }
      }
      let data: any[] = []
      if (cached_data) {
        reply.header('claes-cache', 'hit')
        data = JSON.parse(cached_data)
      } else {
        reply.header('claes-cache', 'miss')
        const pool = await fastify.getSqlPool()
        const repo = new Categories(request.log, pool)
        data = await repo.getIdsWithProducts(request.query.usercode ?? '0', request.jwt?.sub, request.query.culture ?? 'nl', query, o_favorites, o_promo, o_new, department)
        if (query.trim().length === 0 && !o_promo && !o_favorites && !o_new && !department) {
          try {
            redis.set(`menu-product-count-${request.query.usercode ?? '0'}-${date_key}`, JSON.stringify(data))
          } catch {
            request.log.warn('Failed to write to redis cache')
          }
        }
      }

      reply
        .header('Cache-Control', `must-revalidate, max-age=${RESPONSE_MAX_AGE}, private`)
        .header('Expires', new Date(Date.now() + (RESPONSE_MAX_AGE * 1000)).toUTCString())
        .success(data, 200, performance.now() - start)
    } catch (err) {
      request.log.fatal({ err }, 'An unknown error has occurred while processing the request!')
      reply
        .error('An unknown error has occurred while processing the request!')
    }
  })
}
