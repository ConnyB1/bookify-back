<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Bookify Backend - API REST desarrollada con NestJS para la plataforma de intercambio de libros.

## Características

- ✅ Autenticación con AWS Cognito
- ✅ Gestión de libros e intercambios
- ✅ Sistema de calificaciones y notificaciones
- ✅ Upload de imágenes a AWS S3
- ✅ Base de datos PostgreSQL con TypeORM
- ✅ Sistema de chat en tiempo real

## Project setup

```bash
$ npm install
```

## Configuración de Variables de Entorno

Crea un archivo `.env` basándote en `.env.example`:

```bash
cp .env.example .env
```

Configura las siguientes variables:

- **Database**: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- **AWS S3**: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME
- **AWS Cognito**: AWS_COGNITO_USER_POOL_ID, AWS_COGNITO_CLIENT_ID, AWS_COGNITO_REGION
- **App**: PORT, NODE_ENV, HOST

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

### Deploy en Render

#### Opción 1: Deploy desde GitHub (Recomendado)

1. **Conecta tu repositorio en Render**:
   - Ve a [Render Dashboard](https://dashboard.render.com/)
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Render detectará automáticamente el `render.yaml`

2. **Configura las variables de entorno**:
   En el dashboard de Render, ve a Environment y agrega:
   ```
   DB_HOST=tu-host-postgresql
   DB_PORT=5432
   DB_USERNAME=tu-usuario
   DB_PASSWORD=tu-contraseña
   DB_DATABASE=nombre-base-datos
   
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=tu-access-key
   AWS_SECRET_ACCESS_KEY=tu-secret-key
   AWS_S3_BUCKET_NAME=tu-bucket
   
   AWS_COGNITO_USER_POOL_ID=tu-pool-id
   AWS_COGNITO_CLIENT_ID=tu-client-id
   AWS_COGNITO_REGION=us-east-1
   ```

3. **Deploy**:
   - Render construirá y desplegará automáticamente tu aplicación
   - La URL será: `https://bookify-back.onrender.com`

#### Opción 2: Deploy con Docker

1. **Build la imagen**:
```bash
docker build -t bookify-back .
```

2. **Ejecuta localmente para probar**:
```bash
docker run -p 3000:3000 --env-file .env bookify-back
```

3. **Deploy en Render**:
   - Sube tu imagen a Docker Hub o GitHub Container Registry
   - En Render, selecciona "Deploy from Docker"

#### Crear PostgreSQL en Render

1. En Render Dashboard, click "New +" → "PostgreSQL"
2. Crea una nueva base de datos
3. Copia las credenciales generadas
4. Úsalas en las variables de entorno de tu Web Service

### Deploy en Vercel

1. **Instala Vercel CLI**:
```bash
npm install -g vercel
```

2. **Configura las variables de entorno en Vercel**:
   - Ve a tu proyecto en Vercel Dashboard
   - Settings → Environment Variables
   - Agrega todas las variables del archivo `.env`

3. **Despliega**:
```bash
vercel --prod
```

### Configuración de la Base de Datos

Para producción, se recomienda usar:
- **Render PostgreSQL** (recomendado para Render)
- AWS RDS PostgreSQL
- Supabase
- Neon
- Railway

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
