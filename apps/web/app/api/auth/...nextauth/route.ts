import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: "jwt" },
};

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
