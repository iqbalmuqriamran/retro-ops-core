import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "../lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="brutal-border brutal-shadow bg-card p-10 text-center">
        <h1 className="font-display text-7xl text-primary">404</h1>
        <h2 className="mt-4 font-display text-2xl uppercase">SIGNAL LOST</h2>
        <p className="mt-2 text-sm text-muted-foreground uppercase tracking-widest">No route at this coordinate.</p>
        <Link to="/" className="mt-6 inline-block brutal-border bg-secondary px-6 py-3 font-display uppercase text-secondary-foreground hover:bg-primary">
          Return to Base
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="brutal-border brutal-shadow bg-card p-10 text-center max-w-md">
        <h1 className="font-display text-2xl uppercase">SYSTEM FAULT</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => { router.invalidate(); reset(); }} className="brutal-border bg-primary px-5 py-2 font-display uppercase text-primary-foreground">Retry</button>
          <a href="/" className="brutal-border bg-card px-5 py-2 font-display uppercase">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Gadgets World 666 — Operations Console" },
      { name: "description", content: "Constructivist-style operations dashboard for Gadgets World 666 mobile repair, Shah Alam." },
      { property: "og:title", content: "Gadgets World 666 — Ops Console" },
      { property: "og:description", content: "Repair tickets, workshop, inventory and billing in one retro-industrial console." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <Outlet />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              border: "3px solid var(--ink)",
              borderRadius: 0,
              boxShadow: "6px 6px 0 0 var(--ink)",
              background: "var(--cream)",
              color: "var(--ink)",
              fontFamily: "var(--font-display)",
              textTransform: "uppercase",
              fontSize: "13px",
              letterSpacing: "0.05em",
            },
          }}
        />
      </StoreProvider>
    </QueryClientProvider>
  );
}
