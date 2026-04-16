/**
 * Vitest setup file
 * Runs before all tests - handles both node and jsdom environments
 */

// Load environment variables from .env.local before any other setup
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock environment variables for testing
// Preserve real DATABASE_URL for integration tests if TEST_DATABASE_URL is set or DATABASE_URL is a real connection
const isRealDatabase = process.env.TEST_DATABASE_URL ||
  (process.env.DATABASE_URL &&
   process.env.DATABASE_URL !== "postgresql://placeholder" &&
   !process.env.DATABASE_URL.includes("localhost"));

if (!isRealDatabase) {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
}
process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
process.env.CLERK_SECRET_KEY = "test-clerk-secret";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-clerk-publishable";
process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
process.env.PINECONE_API_KEY = "test-pinecone-key";
process.env.PINECONE_INDEX = "test-index";
process.env.QSTASH_TOKEN = "test-qstash-token";
process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
process.env.WORDPRESS_URL = "https://example.com";
process.env.WORDPRESS_USERNAME = "testuser";
process.env.WORDPRESS_APP_PASSWORD = "test-app-password";
process.env.APP_VERSION = "1.0.0-test";
process.env.SKIP_BROWSER_TESTS = "true"; // Skip browser integration tests in unit test runs (require real Chrome/Puppeteer)

// DOM mocks - only apply in jsdom environment
if (typeof window !== "undefined") {
  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: "",
    thresholds: [],
  }));

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
}

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk for frontend tests
vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({
    signOut: vi.fn(),
    openUserProfile: vi.fn(),
  }),
  useUser: () => ({
    user: {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock NextResponse for API route testing
vi.mock("next/server", () => {
  class MockHeaders {
    private _map: Record<string, string> = {};
    set(name: string, value: string) { this._map[name] = value; }
    get(name: string) { return this._map[name] ?? null; }
    has(name: string) { return name in this._map; }
    delete(name: string) { delete this._map[name]; }
    append(name: string, value: string) { this._map[name] = value; }
    forEach(cb: (value: string, name: string) => void) {
      Object.entries(this._map).forEach(([k, v]) => cb(v, k));
    }
  }

  class MockNextResponse {
    data: unknown;
    status: number;
    headers: MockHeaders;

    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.data = body;
      this.status = init?.status || 200;
      this.headers = new MockHeaders();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([k, v]) => this.headers.set(k, v));
      }
    }

    async json() {
      return this.data;
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(data, init);
    }
  }

  return {
    NextRequest: class MockNextRequest {
      url: string;
      nextUrl: URL;
      headers: Headers;
      method: string;
      private _body: unknown;

      constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.headers = new Headers(init?.headers);
        this.method = init?.method || "GET";
        this._body = init?.body ? JSON.parse(init.body) : null;
      }

      async json() {
        return this._body;
      }
    },
    NextResponse: MockNextResponse,
  };
});

// Mock the database for testing
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve([])),
            })),
          })),
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: "test-id" }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: "test-id" }])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}));

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => ({
    userId: "test-user-id",
    orgId: "test-org-id",
  })),
  currentUser: vi.fn(() => ({
    id: "test-user-id",
    emailAddresses: [{ emailAddress: "test@example.com" }],
  })),
}));
