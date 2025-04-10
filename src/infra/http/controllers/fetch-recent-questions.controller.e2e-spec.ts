import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Fetch recent questions (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('[GET] /questions', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: '123456',
      },
    })

    await prisma.question.createMany({
      data: [
        {
          title: 'Nova questão 1',
          content: 'Novo conteúdo',
          slug: 'nova-questao-1',
          authorId: user.id,
        },
        {
          title: 'Nova questão 2',
          content: 'Novo conteúdo',
          slug: 'nova-questao-2',
          authorId: user.id,
        },
      ],
    })

    const accessToken = jwt.sign({ sub: user.id })

    const response = await request(app.getHttpServer())
      .get('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body.questions).toHaveLength(2)
    expect(response.body).toEqual({
      questions: [
        expect.objectContaining({ title: 'Nova questão 1' }),
        expect.objectContaining({ title: 'Nova questão 2' }),
      ],
    })
  })
})
