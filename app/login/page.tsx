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
  const returnTo = nextPath !== "/" ? nextPath : undefined;

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(29,78,216,0.12),transparent_55%),linear-gradient(180deg,#eef1f6_0%,#f5f6f8_42%,#f5f6f8_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(17,24,39,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,24,39,0.04)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_65%_at_50%_40%,#000_20%,transparent_75%)]"
      />

      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark className="h-11 w-11" />
          <h1 className="font-display mt-4 text-[2rem] font-semibold tracking-tight text-ink sm:text-[2.15rem]">
            WorkTrack
          </h1>
        </div>

        <div className="rounded-xl border border-line bg-white px-6 py-7 sm:px-7 sm:py-8">
          <p className="mb-6 text-center text-sm font-medium text-ink-soft">
            Sign in
          </p>
          <LoginForm errorMessage={errorMessage} nextPath={returnTo} />
        </div>
      </div>
    </div>
  );
}
