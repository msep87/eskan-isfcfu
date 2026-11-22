import React, { Component, ComponentType, lazy, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const RELOAD_GUARD_KEY = 'cfuis_chunk_reload_ts';
const RELOAD_COOLDOWN_MS = 15_000;

function isDynamicImportError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk|ChunkLoadError/i.test(
    msg
  );
}

/**
 * Wrapper around React.lazy that automatically retries transient dynamic import
 * failures (e.g. dev-server restart, 504 Outdated Optimize Dep, or temporary
 * network hiccup on large modules) and safely reloads once if chunk hashes are stale.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
        }
      }
    }

    if (typeof window !== 'undefined' && isDynamicImportError(lastError)) {
      try {
        const lastReload = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
        const now = Date.now();
        if (!lastReload || now - lastReload > RELOAD_COOLDOWN_MS) {
          window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
          window.location.reload();
          // Keep Suspense pending while browser reloads so ErrorBoundary doesn't flash
          return await new Promise<{ default: T }>(() => {});
        }
      } catch {
        // Ignore sessionStorage restrictions in private iframes
      }
    }

    throw lastError;
  });
}

interface ChunkErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ChunkErrorBoundary extends Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ChunkErrorBoundaryState {
    const msg = error instanceof Error ? error.message : String(error || '');
    return { hasError: true, errorMessage: msg };
  }

  componentDidUpdate(prevProps: ChunkErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  private handleReload = () => {
    try {
      window.sessionStorage.removeItem(RELOAD_GUARD_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isChunkErr = isDynamicImportError(this.state.errorMessage);

    return (
      <div className="my-8 max-w-lg mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/70 p-6 text-center shadow-lg space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {isChunkErr
              ? 'نسخه جدید سامانه آماده شده یا ارتباط بارگذاری موقتاً قطع شد'
              : 'خطایی هنگام بارگذاری این بخش رخ داد'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            لطفاً روی دکمه زیر کلیک کنید تا بخش موردنظر با جدیدترین نسخه سامانه بارگذاری شود.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-2 transition shadow-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>بارگذاری مجدد صفحه</span>
          </button>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }
}
