import Fastify from '@groupclaes/fastify-elastic'
import redisClient from '@fastify/redis'
import { FastifyInstance } from 'fastify'
import { env } from 'node:process'

import dashboardController from './controllers/dashboard.controller'
import menuController from './controllers/menu.controller'
// import reportsController from './controllers/reports.controller'
import oldreportsController from './controllers/old-reports.controller'
import statisticsController from './controllers/statistics.controller'
import { NewsController } from './controllers/news.controller'
import departmentsController from './controllers/departments.controller'

const LOGLEVEL = 'info'

export default async function start(config: any): Promise<FastifyInstance | undefined> {
  let fastify: FastifyInstance | undefined = undefined
  if (config?.wrapper) {
    if (!config.wrapper.mssql && config.mssql) {
      config.wrapper.mssql = config.mssql
    }
    config.wrapper.cors = { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }
    config.wrapper.jwt = {}

    const fastify = await Fastify(config.wrapper)
    fastify.log.level = LOGLEVEL
    const version_prefix = '/api' + (env.APP_VERSION ? '/' + env.APP_VERSION : '')
    await fastify.register(redisClient, { host: env.APP_VERSION === 'v1' ? 'dis_shop_cache' : 'claes-distribution_webshop_uat_cache' })

    fastify.log.debug(`registering controller 'dashboard' for url '${version_prefix}/${config.wrapper.serviceName}/dashboard'`)
    await fastify.register(dashboardController, {
      prefix: `${version_prefix}/${config.wrapper.serviceName}/dashboard`,
      logLevel: LOGLEVEL
    })

    fastify.log.debug(`registering controller 'menu' for url '${version_prefix}/${config.wrapper.serviceName}/menu'`)
    await fastify.register(menuController, {
      prefix: `${version_prefix}/${config.wrapper.serviceName}/menu`,
      logLevel: LOGLEVEL
    })

    // fastify.log.debug(`registering controller 'reports' for url '${version_prefix}/${config.wrapper.serviceName}/reports'`)
    // await fastify.register(reportsController, { prefix: `${version_prefix}/${config.wrapper.serviceName}/reports`, logLevel: LOGLEVEL })

    fastify.log.debug(`registering controller 'old-reports' for url '${version_prefix}/${config.wrapper.serviceName}/reports'`)
    await fastify.register(oldreportsController, {
      prefix: `${version_prefix}/${config.wrapper.serviceName}/reports`,
      logLevel: LOGLEVEL
    })

    fastify.log.debug(`registering controller 'statistics' for url '${version_prefix}/${config.wrapper.serviceName}/statistics'`)
    await fastify.register(statisticsController, {
      prefix: `${version_prefix}/${config.wrapper.serviceName}/statistics`,
      logLevel: LOGLEVEL
    })

    fastify.log.debug(`registering controller 'news' for url '${version_prefix}/${config.wrapper.serviceName}/news'`)
    await fastify.register(NewsController.register, {
      prefix: `${version_prefix}/${config.wrapper.serviceName}/news`,
      logLevel: LOGLEVEL
    })

    fastify.log.debug(`registering controller 'departments' for url '${version_prefix}/${config.wrapper.serviceName}/departments'`)
    await fastify.register(departmentsController, {
      prefix: `${version_prefix}/${config.wrapper.serviceName}/departments`,
      logLevel: LOGLEVEL
    })
    await fastify.listen({ port: +(env['PORT'] ?? 80), host: '::' })
  }
  return fastify
}
