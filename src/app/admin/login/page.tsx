import Link from "next/link";
import { auth } from "@/auth";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthErrorNotice from "@/components/auth/AuthErrorNotice";
import { signInAdminWithGoogle, switchAdminAccount } from "./actions";

export const metadata = { title: "Entrar no painel | Aurora" };

export default async function AdminLoginPage() {
  // Administrador logado nem chega aqui (o middleware manda para /admin).
  const session = await auth();
  const signedInEmail = session?.user?.email ?? null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-light p-4">
      <Link href="/" className="mb-8 font-serif text-5xl text-primary">
        Aurora
      </Link>

      <div className="w-full max-w-md rounded-lg border border-primary/10 bg-white p-8">
        <h1 className="mb-1 text-2xl font-semibold text-primary">Entrar no painel</h1>

        {signedInEmail ? (
          <div className="flex flex-col gap-5">
            <div role="alert" className="mt-4 rounded-lg border border-dawn-ink/40 bg-dawn/10 p-3 text-sm text-dawn-ink">
              A conta <strong>{signedInEmail}</strong> não tem acesso ao painel. Saia e entre com o Gmail da Aurora.
            </div>
            <form action={switchAdminAccount}>
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-4 font-semibold text-white transition-colors hover:bg-accent-blue"
              >
                Sair e entrar com outra conta
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-primary/70">Use o Gmail da Aurora. O acesso ao painel é só pelo Google.</p>
            <AuthErrorNotice />
            <form action={signInAdminWithGoogle}>
              <GoogleButton label="Entrar com Google" />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
