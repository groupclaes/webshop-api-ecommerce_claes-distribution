import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

import DepartmentRepository from '../repositories/department.repository'

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
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const culture = request.query.culture ?? 'nl'

      const data = await repo.list(request.query.token, request.query.usercode, culture)

      request.log.debug({ departments_length: data?.length }, 'fetched departments')
      reply.success(data, undefined, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to fetch departments from database')
      reply.error('failed to fetch departments from database')
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
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const department = request.body

      const data = await repo.create(request.query.token, request.query.usercode, department)
      reply.success(data, undefined, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to create department in database')
      reply.error('failed to fetch create in database')
    }
  })

  /**
   * Get all departments for current user
   * @route PUT /api/{APP_VERSION}/ecommerce/departments/:id
   */
  fastify.put('/:id', async function updateDepartment(request: FastifyRequest<{
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
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const id = request.params.id
      const department = request.body

      const data = await repo.update(request.query.token, request.query.usercode, id, department)
      reply.success(data, undefined, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to update department in database')
      reply.error('failed to fetch update in database')
    }
  })

  /**
   * Delete department with user
   * @route DELETE /api/{APP_VERSION}/ecommerce/departments/:id
   */
  fastify.delete('/:id', async function deleteDepartment(request: FastifyRequest<{
    Params: {
      id: number
    }, Querystring: {
      token: string
      usercode: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const id = request.params.id
      const department = request.body

      const data = await repo.update(request.query.token, request.query.usercode, id, department)
      reply.success(data, undefined, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to delete department in database')
      reply.error('failed to fetch delete in database')
    }
  })

  /**
   * Get all departments for current user
   * @route POST /api/{APP_VERSION}/ecommerce/departments/:id/products/:product_id
   */
  fastify.post('/:id/products/:product_id', async function createDepartment(request: FastifyRequest<{
    Params: {
      id: number
      product_id: number
    }, Querystring: {
      token: string
      usercode: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const id = request.params.id
      const product_id = request.params.product_id

      const data = await repo.createProduct(request.query.token, request.query.usercode, id, product_id)
      reply.success(data, undefined, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to add product to department in database')
      reply.error('failed to add product to department in database')
    }
  })

  /**
   * Delete department with user
   * @route DELETE /api/{APP_VERSION}/ecommerce/departments/:id/products/:product_id
   */
  fastify.delete('/:id/products/:product_id', async function deleteDepartment(request: FastifyRequest<{
    Params: {
      id: number
      product_id: number
    }, Querystring: {
      token: string
      usercode: string
    }
  }>, reply: FastifyReply) {
    const start = performance.now()
    try {
      // if (!request.jwt)
      //   return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new DepartmentRepository(request.log, pool)
      const id = request.params.id
      const product_id = request.params.product_id

      const data = await repo.deleteProduct(request.query.token, request.query.usercode, id, product_id)
      reply.success(data, undefined, performance.now() - start)
    } catch (err) {
      request.log.error({ err }, 'Failed to remove product from department in database')
      reply.error('failed to fetch remove product from department in database')
    }
  })
}
