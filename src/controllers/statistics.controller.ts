import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import StatisticsRepository, { IStatisticPayload } from 'src/repositories/statistics.repository'

export default async function (fastify: FastifyInstance) {
  /**
   * Get a list of all available reports the current user can request
   * @route POST /api/{APP_VERSION}/ecommerce/statistics
   */
  fastify.post('', async (request: FastifyRequest<{
    Body: IStatisticPayload,
    Querystring: {
      token?: string
    }
  }>, reply: FastifyReply) => {
    const start = performance.now()

    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new StatisticsRepository(request.log, pool)
      const token = request.query.token || '00000000-0000-0000-0000-000000000000'

      let payload = request.body
      if (request.jwt?.sub)
        payload.uid = request.jwt.sub

      request.log.debug('adding statistic entry into database')
      const data = await repo.add(payload, token)

      if (data) {
        request.log.debug('insert success')
        return reply.success(undefined, 204, performance.now() - start)
      }
      return reply.error('could not insert record into DB!', 500, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to insert statistic into database')
      return reply.error('failed to insert statistic into database', 500, performance.now() - start)
    }
  })
}