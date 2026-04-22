import type { NextAuthOptions } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID ?? '',
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? '',
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.userId = account.providerAccountId
      } else if (typeof token.userId !== 'string' && typeof token.sub === 'string') {
        token.userId = token.sub
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === 'string') {
        session.user.id = token.userId
      }

      return session
    },
  },
}
