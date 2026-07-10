import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({ where: { email: credentials.email } })

        if (!user) {
          // actorId=null — email не найден в БД
          await db.auditLog
            .create({
              data: {
                action: 'login_failed',
                entity: 'User',
                entityId: credentials.email,
                payload: { reason: 'user_not_found', email: credentials.email },
              },
            })
            .catch(() => null)
          return null
        }

        const passwordValid = await compare(credentials.password, user.passwordHash)

        if (!passwordValid) {
          await db.auditLog
            .create({
              data: {
                actorId: user.id,
                action: 'login_failed',
                entity: 'User',
                entityId: user.id,
                payload: { reason: 'wrong_password', email: credentials.email },
              },
            })
            .catch(() => null)
          return null
        }

        await db.auditLog
          .create({
            data: {
              actorId: user.id,
              action: 'login_success',
              entity: 'User',
              entityId: user.id,
              payload: { email: credentials.email },
            },
          })
          .catch(() => null)

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role
        token.id = user.id
        token.issuedAt = Math.floor(Date.now() / 1000)
      }

      // Проверка принудительного завершения сессий
      if (token.id) {
        const dbUser = await db.user
          .findUnique({
            where: { id: token.id as string },
            select: { sessionsInvalidatedAt: true },
          })
          .catch(() => null)

        if (dbUser?.sessionsInvalidatedAt) {
          const invalidatedAt = Math.floor(dbUser.sessionsInvalidatedAt.getTime() / 1000)
          if (((token.issuedAt as number) ?? 0) < invalidatedAt) {
            return {} // токен выпущен до инвалидации
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (!token.id) return { ...session, user: undefined } // инвалидирован
      if (token && session.user) {
        ;(session.user as { role: string; id: string }).role = token.role as string
        ;(session.user as { id: string }).id = token.id as string
      }
      return session
    },
  },
}
