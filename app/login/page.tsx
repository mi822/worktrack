import { BrandMark } from "@/components/brand-mark";
import { getSignInErrorMessage } from "@/app/actions/auth";
import { LoginForm } from "@/app/login/login-form";
import { safeScanReturnPath } from "@/lib/presence/scan-payload";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = await getSignInErrorMessage(params.error);
  const nextPath = safeScanReturnPath(params.next);
  const returnToScan = nextPath !== "/" ? nextPath : undefined;

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e8e4d9_0%,_transparent_55%)]"
      />
      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark className="h-10 w-10" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
            WorkTrack
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {returnToScan
              ? "Sign in as an employee, intern, manager, or project head. Opening this link records presence — you do not scan again inside WorkTrack."
              : "Sign in with the account created for you."}
          </p>
        </div>
        <div className="panel p-7">
          <LoginForm errorMessage={errorMessage} nextPath={returnToScan} />
        </div>
      </div>
    </div>
  );
}
