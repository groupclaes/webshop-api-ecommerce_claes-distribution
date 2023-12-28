import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import sql from 'mssql'
import oe from '@groupclaes/oe-connector'

import Cart from '../repositories/carts.repository'

declare module 'fastify' {
  export interface FastifyInstance {
    getSqlPool: (name?: string) => Promise<sql.ConnectionPool>
  }

  export interface FastifyRequest {
    jwt: JWTPayload
    hasRole: (role: string) => boolean
    hasPermission: (permission: string, scope?: string) => boolean
  }

  export interface FastifyReply {
    success: (data?: any, code?: number, executionTime?: number) => FastifyReply
    fail: (data?: any, code?: number, executionTime?: number) => FastifyReply
    error: (message?: string, code?: number, executionTime?: number) => FastifyReply
  }
}

export default async function (fastify: FastifyInstance) {
  fastify.get('', async (request: FastifyRequest<{
    Querystring: {
      usercode: number
      culture?: string
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new Cart(request.log, pool)
      const usercode = request.query.usercode
      const culture = request.query.culture ?? 'nl'

      request.log.debug({}, 'fetching carts')
      const data = await repo.get(usercode, request.jwt.sub, culture)

      request.log.debug({ carts_length: data?.length }, 'fetched carts')
      return reply.success(data)
    } catch (err) {
      request.log.error({ err }, 'Failed to fetch carts from database')
      return reply.error('failed to fetch carts from database')
    }
  })

  // add / remove product from cart
  fastify.put('/products', async (request: FastifyRequest<{
    Querystring: {
      usercode: number
      culture?: string
    },
    Body: {
      product_id: number,
      quantity: number
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new Cart(request.log, pool)
      const usercode = request.query.usercode
      const culture = request.query.culture ?? 'nl'

      request.log.debug({ usercode, product_id: request.body.product_id, quantity: request.body.quantity }, 'requesting cart update')

      if (request.jwt.sub) {
        await repo.updateProduct(usercode, request.jwt.sub, request.body.product_id, request.body.quantity)
        request.log.debug({ usercode, product_id: request.body.product_id }, 'cart update success')
      }

      const data = await repo.get(usercode, request.jwt.sub, culture)
      return reply.success(data)
    } catch (err) {
      request.log.error({ product_id: request.body.product_id, err }, 'failed to update cart')
      return reply.error('failed to update cart')
    }
  })

  // send cart
  fastify.post('/:id', async (request: FastifyRequest<{
    Body: any,
    Params: {
      id: number
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.jwt)
        return reply.error('missing jwt!', 401)

      const pool = await fastify.getSqlPool()
      const repo = new Cart(request.log, pool)

      request.log.debug({}, 'requesting post cart to openedge')
      if (request.jwt.sub) {
        const order: any = request.body
        // get user info from db
        const user = await repo.getUserInfo(request.jwt.sub)
        // get products info from db
        const products = await repo.getProductInfos(order.products)

        const oe_payload = mapPayload(order, user, products)

        oe.configure({
          c: false
        })

        request.log.debug({ oe_payload, usercode: user.usercode }, 'running apslj100b')
        const oeResponse = await oe.run('apslj100b.p', [
          'GRO',
          oe_payload,
          user.usercode,
          undefined
        ], {
          tw: -1,
          simpleParameters: true,
          parameterDefaults: {
            in: 'string',
            out: 'string'
          }
        })

        request.log.debug({}, 'apslj100b successful')
        if (oeResponse) {
          if (oeResponse.status === 200 && oeResponse.result) {
            const success = await repo.deactivateCart(+request.params.id, request.jwt.sub)
            return reply.success({ success })
          }
          else
            return reply.fail({ reason: 'invallid oe response' })
        }
      }

      request.log.debug({ reason: 'no user_id supplied' }, 'Unauthorized')
      return reply.fail({ reason: 'no user_id supplied' }, 401)
    } catch (err) {
      request.log.fatal({ body: request.body, err }, 'failed to send order!')
      return reply.error('failed to send order!')
    }
  })

  function mapPayload(order: any, user: any, products: any[]) {
    return {
      dsOrders: {
        ttOrdMst: [{
          CustNum: order.customer.id,
          DelvAdr: order.customer.address_id,
          CustCol: order.deliveryInfo.method !== 'transport',
          ComplDelv: order.deliveryInfo.option !== 'parts',
          CustRef: order.invoiceInfo.reference,
          DelvDate: undefined,
          NextDelv: order.invoiceInfo.nextDate,
          OrdWay: user.user_type === 1 || user.user_type === 4 ? 'B2B' : 'a_v'
          //Username: user.username
        }],
        ttOrdDtl: products.map((product, i) => ({
          ItemNum: product.itemnum,
          Qty: product.quantity,
          SalUnit: product.unit,
          TmpOrdLine: i
        })),
        ttOrdMstText: [{
          InfoText: order.invoiceInfo.comment
        }]
      }
    }
  }
}