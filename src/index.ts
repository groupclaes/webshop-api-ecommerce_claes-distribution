import Fastify from '@groupclaes/fastify-elastic'
import { FastifyInstance } from 'fastify'
import { env } from 'process'

import dashboardController from './controllers/dashboard.controller'

const LOGLEVEL = 'debug'

export default async function (config: any): Promise<FastifyInstance | undefined> {
  if (!config || !config.wrapper) return

  const fastify = await Fastify(config.wrapper)
  const version_prefix = '/api' + (env.APP_VERSION ? '/' + env.APP_VERSION : '')
  await fastify.register(dashboardController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/dashboard`, logLevel: LOGLEVEL })
  await fastify.listen({ port: +(env['PORT'] ?? 80), host: '::' })

  return fastify
}
