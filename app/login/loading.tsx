export default function LoginLoading() {
  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="skeleton mx-auto h-10 w-10 rounded-xl" />
        <div className="skeleton mx-auto mt-4 h-7 w-36" />
        <div className="panel mt-8 space-y-4 p-7">
          <div className="skeleton h-10" />
          <div className="skeleton h-10" />
          <div className="skeleton h-10" />
        </div>
      </div>
    </div>
  );
}
