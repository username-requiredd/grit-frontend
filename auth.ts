import NextAuth, { type DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { SignJWT, jwtVerify } from "jose"

// 1. Single, strict module declaration to prevent interface merging conflicts
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    accessToken?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // 2. JWT strategy (Edge runtime compatible, Prisma adapter removed)
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  // Cookie configuration for development
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // Don't set secure in development, it breaks on localhost
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  // ✅ CRITICAL FIX: Add JWT encode/decode configuration for Edge runtime
  jwt: {
    async encode({ secret, token }) {
      console.log("[NextAuth JWT Encode] Starting encode with token:", { id: token?.id, email: token?.email, role: token?.role });
      if (!token) {
        console.log("[NextAuth JWT Encode] No token provided");
        return "";
      }
      
      try {
        // Handle secret as string or array
        const secretStr = typeof secret === 'string' ? secret : secret[0];
        if (!secretStr) {
          console.error("[NextAuth JWT Encode] Secret is empty or undefined!");
          return "";
        }
        console.log("[NextAuth JWT Encode] Secret type:", typeof secretStr, "length:", secretStr.length);
        
        const encodedSecret = new TextEncoder().encode(secretStr);
        
        const jwt = await new SignJWT(token as any)
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(encodedSecret);
          
        console.log("[NextAuth JWT Encode] ✅ JWT encoded successfully");
        return jwt;
      } catch (error) {
        console.error("[NextAuth JWT Encode] ❌ Encode failed:", error);
        throw error;
      }
    },
    async decode({ secret, token }) {
      console.log("[NextAuth JWT Decode] Starting decode, token present:", !!token);
      if (!token) {
        console.log("[NextAuth JWT Decode] No token provided");
        return null;
      }
      
      try {
        // Handle secret as string or array
        const secretStr = typeof secret === 'string' ? secret : secret[0];
        if (!secretStr) {
          console.error("[NextAuth JWT Decode] Secret is empty or undefined!");
          return null;
        }
        console.log("[NextAuth JWT Decode] Secret type:", typeof secretStr, "length:", secretStr.length);
        
        const encodedSecret = new TextEncoder().encode(secretStr);
        
        const { payload } = await jwtVerify(token, encodedSecret);
        console.log("[NextAuth JWT Decode] ✅ JWT decoded successfully:", { id: payload?.id, email: payload?.email, role: payload?.role });
        return payload as any;
      } catch (error) {
        console.error("[NextAuth JWT Decode] ❌ Decode failed:", error instanceof Error ? error.message : error);
        return null;
      }
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[NextAuth Authorize] Credentials provider - Starting with email:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.error("[NextAuth Authorize] Missing email or password");
          return null;
        }

        try {
          console.log("[NextAuth Authorize] Calling backend /auth/login");
          // 3. Delegate credential validation to the NestJS Backend
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            })
          });

          console.log("[NextAuth Authorize] Backend responded with status:", res.status);
          
          if (!res.ok) {
            console.error("[NextAuth Authorize] Backend returned error status:", res.status);
            return null; // Invalid credentials
          }

          const backendResponse = await res.json();
          console.log("[NextAuth Authorize] Backend response:", { 
            userId: backendResponse.user?.id, 
            email: backendResponse.user?.email, 
            role: backendResponse.user?.role,
            hasAccessToken: !!backendResponse.access_token
          });
          
          // Return the structured user object along with the backend JWT
          // This is passed to jwt() callback
          const userObject = {
            id: backendResponse.user.id,
            email: backendResponse.user.email,
            name: backendResponse.user.name,
            image: backendResponse.user.image,
            role: backendResponse.user.role || 'USER', // Ensure role is always a string
            accessToken: backendResponse.access_token,
          };
          
          // Validate the constructed user object
          if (!userObject.id) {
            console.error("[NextAuth Authorize] ❌ CRITICAL: User ID missing from backend response!");
            return null;
          }
          if (!userObject.email) {
            console.error("[NextAuth Authorize] ❌ CRITICAL: User email missing from backend response!");
            return null;
          }
          if (!userObject.role) {
            console.error("[NextAuth Authorize] ❌ CRITICAL: User role missing from backend response!");
            return null;
          }
          
          console.log("[NextAuth Authorize] ✅ Returning credentials user object:", { id: userObject.id, email: userObject.email, role: userObject.role });
          return userObject;
        } catch (error) {
          console.error("[NextAuth Authorize] ❌ Error:", error instanceof Error ? error.message : error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // 4. Sync Google logins with the NestJS backend to issue a backend JWT
      console.log("[NextAuth SignIn] Callback triggered:", { 
        provider: account?.provider,
        userFields: Object.keys(user),
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          image: user.image,
          picture: (user as any).picture,  // Google might return 'picture' field
        }
      });

      if (account?.provider === 'google') {
        try {
          // CRITICAL FIX: Google returns 'picture', not 'image'
          const imageUrl = user.image || (user as any).picture;
          
          console.log("[NextAuth SignIn] 🔵 Google OAuth - Calling backend /auth/google");
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: user.email, 
              name: user.name, 
              image: imageUrl  // Use the correct field
            })
          });
          
          console.log("[NextAuth SignIn] Backend responded with status:", res.status);
          
          if (res.ok) {
            const backendData = await res.json();
            console.log("[NextAuth SignIn] Backend response:", { 
              userId: backendData.user?.id,
              email: backendData.user?.email,
              role: backendData.user?.role,
              hasAccessToken: !!backendData.access_token
            });
            
            // CRITICAL FIX: NextAuth v5 signIn callback MUST return true/false, not a user object
            // Mutations to the user object parameter DO persist to jwt() callback
            // So we mutate the user object with backend data (authoritative source)
            user.id = backendData.user.id;
            user.email = backendData.user.email;
            user.name = backendData.user.name;
            user.image = backendData.user.image;
            user.role = backendData.user.role || 'USER';
            (user as any).accessToken = backendData.access_token;
            
            console.log("[NextAuth SignIn] ✅ OAuth user mutated with backend data:", { 
              id: user.id, 
              email: user.email,
              role: user.role,
              hasAccessToken: !!(user as any).accessToken
            });
            
            // Return true to proceed - user object with mutations will be passed to jwt()
            return true;
          }
          
          console.error("[NextAuth SignIn] ❌ Backend returned error status:", res.status);
          const errorBody = await res.json().catch(() => ({}));
          console.error("[NextAuth SignIn] Error details:", errorBody);
          return false; // Reject sign-in if backend sync fails
        } catch (error) {
          console.error("[NextAuth SignIn] ❌ Google backend sync error:", error instanceof Error ? error.message : error);
          return false;
        }
      }
      
      console.log("[NextAuth SignIn] ✅ Credentials provider - passing through");
      return true; // Let standard credentials pass through naturally
    },
    async jwt({ token, user, account }) {
      // 5. Initial sign in: attach ALL backend user properties to JWT token
      console.log("[NextAuth JWT] Callback triggered:", { 
        hasUser: !!user,
        account: account?.provider,
        tokenFields: token?.id ? Object.keys(token).filter(k => typeof token[k] !== 'object') : [],
        userFields: user ? Object.keys(user).filter(k => typeof (user as Record<string, unknown>)[k] !== 'object') : []
      });
      
      if (user) {
        console.log("[NextAuth JWT] Creating new token with user data:", { 
          id: user.id, 
          email: user.email, 
          role: user.role || 'unknown',
          hasAccessToken: !!(user as any).accessToken
        });
        
        // CRITICAL: Ensure ALL user fields are stored in token
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = user.role || 'USER';
        token.accessToken = (user as any).accessToken;  // accessToken from OAuth/credentials
        
        // Validate critical fields after assignment
        if (!token.id) {
          console.error("[NextAuth JWT] ❌ CRITICAL: token.id is empty after user assignment!");
        }
        if (!token.email) {
          console.error("[NextAuth JWT] ❌ CRITICAL: token.email is empty after user assignment!");
        }
        if (!token.role) {
          console.error("[NextAuth JWT] ❌ CRITICAL: token.role is empty after user assignment!");
        }
        if (!token.accessToken) {
          console.warn("[NextAuth JWT] ⚠️ WARNING: token.accessToken is empty (might be normal for some flows)");
        }
        
        console.log("[NextAuth JWT] ✅ Token updated with user data:", { 
          id: token.id,
          email: token.email,
          role: token.role,
          hasAccessToken: !!token.accessToken
        });
      } else {
        console.log("[NextAuth JWT] No user object (token refresh), keeping existing token fields");
        
        // Validate existing token during refresh
        if (!token.id) {
          console.error("[NextAuth JWT] ❌ Token refresh: missing token.id!");
        }
        if (!token.email) {
          console.error("[NextAuth JWT] ❌ Token refresh: missing token.email!");
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // 6. Send token properties securely to the Next.js client
      console.log("[NextAuth Session] Callback triggered with token:", { 
        id: token?.id, 
        email: token?.email,
        role: token?.role,
        hasAccessToken: !!token?.accessToken,
        tokenFields: token ? Object.keys(token).filter(k => typeof token[k] !== 'object') : []
      });
      
      if (!token) {
        console.error("[NextAuth Session] ⚠️ CRITICAL: Token is null or undefined!");
        return session;
      }
      
      // Validate required token fields exist before copying
      if (!token.id) {
        console.error("[NextAuth Session] ❌ Missing required field: token.id");
      }
      if (!token.email) {
        console.error("[NextAuth Session] ❌ Missing required field: token.email");
      }
      if (!token.role) {
        console.error("[NextAuth Session] ❌ Missing required field: token.role");
      }
      
      // Only populate session if token has required fields
      // Otherwise return empty session to force re-authentication
      if (token.id && token.email && token.role) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.role = (token.role as string) || 'USER';
        session.accessToken = token.accessToken as string;
        
        console.log("[NextAuth Session] ✅ Session populated from token:", { 
          userId: session.user.id,
          role: session.user.role,
          hasAccessToken: !!session.accessToken
        });
      } else {
        console.error("[NextAuth Session] ❌ Cannot populate session - token missing required fields");
        console.error("[NextAuth Session] Token dump:", JSON.stringify(token, null, 2));
      }
      
      return session;
    }
  }
})