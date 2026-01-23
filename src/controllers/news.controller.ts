import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyRedis } from '@fastify/redis'

import { NewsRepository } from '../repositories/news.repository'

const RESPONSE_MAX_AGE = 60 * 60 * 24

export class NewsController {
  private readonly _fastify: FastifyInstance

  constructor(fastify: FastifyInstance) {
    this._fastify = fastify

    const get = this.get.bind(this)

    fastify.get('', get)
    fastify.get('/:id', get)

    fastify.get('/last', (req: any, res: any) => this.getLast(req, res))
  }

  async get(request: FastifyRequest<{
    Querystring: {
      token: string
      usercode: string
      culture?: string
    }, Params: {
      id?: number
    }
  }>, reply: FastifyReply) {
    const start = performance.now()
    const date_key = new Date().toJSON().slice(0, 10)

    try {
      const redis: FastifyRedis = this._fastify.redis
      let cached_data: string
      try {
        cached_data = await redis.get(`news-${date_key}-${request.query.usercode}-${request.params.id ?? 0}`)
      } catch {
        request.log.warn('Failed to read from redis cache')
      }
      let data: any[] = []
      if (cached_data) {
        reply.header('claes-cache', 'hit')
        data = JSON.parse(cached_data)
      } else {
        reply.header('claes-cache', 'miss')
        const pool = await this._fastify.getSqlPool()
        const repo = new NewsRepository(request.log, pool)
        if (request.params.id) {
          // data = await repo.read(request.params.id, request.query.usercode, request.jwt?.sub, request.query.culture ?? 'nl')
          data = await repo.read(request.query.token, request.params.id, request.query.usercode, request.query.culture ?? 'nl')
        } else {
          // data = await repo.list(request.query.usercode, request.jwt?.sub, request.query.culture ?? 'nl')
          data = await repo.list(request.query.token, request.query.usercode, request.query.culture ?? 'nl')
        }
        try {
          // redis.set(`menu-${date_key}-${request.query.usercode}-${request.params.id ?? 0}`, JSON.stringify(data))
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
  }

  async getLast(request: FastifyRequest<{
    Querystring: {
      token: string
      usercode: string
      culture?: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()
    const date_key = new Date().toJSON().slice(0, 10)

    try {
      const redis: FastifyRedis = this._fastify.redis
      let cached_data: string
      try {
        cached_data = await redis.get(`news-${date_key}-${request.query.usercode}-last`)
      } catch {
        request.log.warn('Failed to read from redis cache')
      }
      let data: any[] = []
      if (cached_data) {
        reply.header('claes-cache', 'hit')
        data = JSON.parse(cached_data)
      } else {
        reply.header('claes-cache', 'miss')
        const pool = await this._fastify.getSqlPool()
        const repo = new NewsRepository(request.log, pool)
        // data = await repo.read(-1, request.query.usercode, request.jwt?.sub, request.query.culture ?? 'nl')
        data = await repo.read(request.query.token, -1, request.query.usercode, request.query.culture ?? 'nl')
        try {
          redis.set(`menu-${date_key}-${request.query.usercode}-last`, JSON.stringify(data))
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
  }

  static async register(fastify: FastifyInstance) {
    return new NewsController(fastify)
  }
}
