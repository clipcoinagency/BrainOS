/**
 * Public surface of the auth feature.
 *
 * This barrel is client-safe: it exports UI, server actions ("use server", safe
 * to import anywhere), and schemas. Server-only helpers live in `./queries` and
 * must be imported from `@/features/auth/queries` in Server Components only.
 */
export { signIn, signUp, signOut, type AuthResult } from "./actions";
export { LoginForm } from "./components/login-form";
export { SignupForm } from "./components/signup-form";
export {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "./schemas";
