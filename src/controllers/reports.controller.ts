import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from 'jose'
import sql from 'mssql'
import fetch from 'httpntlm'

import ReportRepository from '../repositories/report.repository'