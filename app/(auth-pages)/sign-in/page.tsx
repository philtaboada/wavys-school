import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex justify-center items-center w-full h-full">
      <form className="flex-1 flex flex-col min-w-64 max-w-md mx-auto p-6">
        <h1 className="text-2xl font-medium">Iniciar sesión</h1>
        <p className="text-sm text-foreground">
          ¿No tienes una cuenta?{" "}
          <Link className="text-foreground font-medium underline" href="/sign-up">
            Regístrate
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input name="email" placeholder="tucorreo@ejemplo.com" required />
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              className="text-xs text-foreground underline"
              href="/forgot-password"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            type="password"
            name="password"
            placeholder="Tu contraseña"
            required
          />
          <SubmitButton pendingText="Iniciando sesión..." formAction={signInAction}>
            Iniciar sesión
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
