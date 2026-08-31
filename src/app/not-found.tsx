import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 text-center">
      <div className="animate-fade-up">
        <p className="font-mono text-sm font-bold tracking-widest text-holo-pink">404</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
          This card slipped out of the binder.
        </h1>
        <p className="mt-4 text-zinc-500">
          The page you are looking for does not exist — it may have been
          reprinted under a different number.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-gradient-to-r from-holo-blue to-holo-purple px-6 py-3 text-sm font-bold text-white shadow-lg shadow-holo-blue/30 transition-transform duration-200 hover:-translate-y-0.5"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
