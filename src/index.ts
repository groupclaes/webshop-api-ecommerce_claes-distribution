import Fastify from '@groupclaes/fastify-elastic'
import { FastifyInstance } from 'fastify'
import { env } from 'process'

import dashboardController from './controllers/dashboard.controller'
import reportsController from './controllers/reports.controller'
import oldreportsController from './controllers/old-reports.controller'
import statisticsController from './controllers/statistics.controller'

const LOGLEVEL = 'debug'

export default async function (config: any): Promise<FastifyInstance | undefined> {
  if (!config || !config.wrapper) return

  const fastify = await Fastify(config.wrapper)
  fastify.log.level = LOGLEVEL
  const version_prefix = '/api' + (env.APP_VERSION ? '/' + env.APP_VERSION : '')
  fastify.log.debug(`registering controller 'dashboard' for url '${version_prefix}/${config.wrapper.serviceName}/dashboard'`)
  await fastify.register(dashboardController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/dashboard`, logLevel: LOGLEVEL })
  fastify.log.debug(`registering controller 'reports' for url '${version_prefix}/${config.wrapper.serviceName}/reports'`)
  // await fastify.register(reportsController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/reports`, logLevel: LOGLEVEL })
  await fastify.register(oldreportsController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/reports`, logLevel: LOGLEVEL })
  await fastify.register(statisticsController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/statistics`, logLevel: LOGLEVEL })
  await fastify.listen({ port: +(env['PORT'] ?? 80), host: '::' })

  return fastify
}
