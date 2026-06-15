import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import DepartmentRepository from '../repositories/department.repository'
import { createSqlECSEvent, ECSEventSeverity, IECS, IECSEvent } from '../ecs'

export default async function departmentsController(fastify: FastifyInstance) {
  /**
   * Get all departments for current user
   * @route GET /api/{APP_VERSION}/ecommerce/departments
   */
  fastify.get('', async function listDepartments(request: FastifyRequest<{
    Querystring: {
      token: string
      usercode: string
      culture?: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    let event: IECSEvent = createSqlECSEvent('access-departments')
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      // const culture = request.query.culture ?? 'nl'

      const data = await repo.list(request.query.token, request.query.usercode)

      request.log.debug('procedure run success!')
      event.outcome = 'success'
      event.type.push('allowed')

      request.log.debug({ departments_length: data?.length }, 'fetched departments')
      reply.success(data, undefined, performance.now() - start)
    } catch (err) {
      event.severity = ECSEventSeverity.Error
      event.type.push('error')
      request.log.error({ err }, 'Failed to fetch departments from database')
      reply.error('failed to fetch departments from database')
    } finally {
      request.log.info({ event } as IECS)
    }
  })

  /**
   * Get all departments for current user
   * @route POST /api/{APP_VERSION}/ecommerce/departments
   */
  fastify.post('', async function createDepartment(request: FastifyRequest<{
    Querystring: {
      token: string
      usercode: string
    }, Body: {
      name: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    let event: IECSEvent = createSqlECSEvent('create-departments', ['creation'])
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const department = request.body

      const data = await repo.create(request.query.token, request.query.usercode, department)

      if (data) {
        event.outcome = 'success'
        event.type.push('allowed')
        reply.success(data, undefined, performance.now() - start)
      } else {
        request.log.warn('procedure run failure!')
        event.outcome = 'failure'
        event.type.push('denied')
        reply.fail(data, undefined, performance.now() - start)
      }
    } catch (err) {
      event.severity = ECSEventSeverity.Error
      event.type.push('error')
      request.log.error({ err }, 'Failed to create department in database')
      reply.error('failed to fetch create in database')
    } finally {
      request.log.info({ event } as IECS)
    }
  })

  /**
   * Get all departments for current user
   * @route PUT /api/{APP_VERSION}/ecommerce/departments/:id
   */
  fastify.put('/:id', { config: { cors: { methods: 'PUT,DELETE' } } }, async function updateDepartment(request: FastifyRequest<{
    Params: {
      id: number
    }, Querystring: {
      token: string
      usercode: string
    }, Body: {
      name: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    let event: IECSEvent = createSqlECSEvent('change-departments', ['change'])
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const id = request.params.id
      const department = request.body

      const data = await repo.update(request.query.token, request.query.usercode, id, department)

      if (data) {
        event.outcome = 'success'
        event.type.push('allowed')
        reply.success(data, undefined, performance.now() - start)
      } else {
        request.log.warn('procedure run failure!')
        event.outcome = 'failure'
        event.type.push('denied')
        reply.fail(data, undefined, performance.now() - start)
      }
    } catch (err) {
      event.severity = ECSEventSeverity.Error
      event.type.push('error')
      request.log.error({ err }, 'Failed to update department in database')
      reply.error('failed to fetch update in database')
    } finally {
      request.log.info({ event } as IECS)
    }
  })

  /**
   * Delete department with user
   * @route DELETE /api/{APP_VERSION}/ecommerce/departments/:id
   */
  fastify.delete('/:id', { config: { cors: { methods: 'PUT,DELETE' } } }, async function deleteDepartment(request: FastifyRequest<{
    Params: {
      id: number
    }, Querystring: {
      token: string
      usercode: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    let event: IECSEvent = createSqlECSEvent('delete-departments', ['deletion'])
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const id = request.params.id
      const department = request.body

      const data = await repo.update(request.query.token, request.query.usercode, id, department)

      if (data) {
        event.outcome = 'success'
        event.type.push('allowed')
        reply.success(data, undefined, performance.now() - start)
      } else {
        request.log.warn('procedure run failure!')
        event.outcome = 'failure'
        event.type.push('denied')
        reply.fail(data, undefined, performance.now() - start)
      }
    } catch (err) {
      event.severity = ECSEventSeverity.Error
      event.type.push('error')
      request.log.error({ err }, 'Failed to delete department in database')
      reply.error('failed to fetch delete in database')
    } finally {
      request.log.info({ event } as IECS)
    }
  })

  /**
   * add/remove (based on {mode} a product from a department
   * @route PUT /api/{APP_VERSION}/ecommerce/departments/:id/products
   */
  fastify.put('/:id/products', { config: { cors: { methods: 'GET,PUT' } } }, async function createDepartment(request: FastifyRequest<{
    Params: {
      id: number
    }, Body: {
      mode: 'add' | 'remove',
      product_id: number
    }, Querystring: {
      token: string
      usercode: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()

    let event: IECSEvent = createSqlECSEvent('change-departments-products', ['change'])
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)

      const data = await repo.updateProducts(request.query.token, request.query.usercode, request.params.id, request.body.product_id, request.body.mode)

      if (data) {
        event.outcome = 'success'
        event.type.push('allowed')
        reply.success(data, undefined, performance.now() - start)
      } else {
        request.log.warn('procedure run failure!')
        event.outcome = 'failure'
        event.type.push('denied')
        reply.fail(data, undefined, performance.now() - start)
      }
    } catch (err) {
      event.severity = ECSEventSeverity.Error
      event.type.push('error')
      request.log.error({ err }, 'Failed to perform action on product for department in database')
      reply.error('failed to perform action on product for department in database')
    } finally {
      request.log.info({ event } as IECS)
    }
  })
}
