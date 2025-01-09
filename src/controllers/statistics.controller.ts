import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import StatisticsRepository, { IStatisticPayload } from 'src/repositories/statistics.repository'

export default async function (fastify: FastifyInstance) {
  /**
   * Get a list of all available reports the current user can request
   * @route GET /api/{APP_VERSION}/ecommerce/reports
   */
  fastify.get('', async (request: FastifyRequest<{
    Body: IStatisticPayload
  }>, reply: FastifyReply) => {
    const start = performance.now()

    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new StatisticsRepository(request.log, pool)

      let payload = request.body
      payload.uid = request.jwt.sub

      request.log.debug('adding statistic entry into database')
      const data = await repo.add(payload)

      if (data) {
        request.log.debug('insert success')
        return reply.success(undefined, 204, performance.now() - start)
      }
      return reply.error('could not insert record into DB!', 500, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to fetch reports from database')
      return reply.error('failed to fetch reports from database', 500, performance.now() - start)
    }
  })
}