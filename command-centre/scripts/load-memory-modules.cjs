/**
 * Shared loader for the PGLite memory module graph.
 *
 * The repo has no build step: the .ts memory modules are loaded at runtime via
 * loadTsModule, leaf-first, each injected as a stub into the modules that import
 * it (the same pattern the tests use). memory-index/search/capture/status all
 * need the same graph, so it lives here once.
 *
 * Returns the loaded modules. Pass { withSearch: true } to also load the
 * reranker + search modules (memory-search), { withCapture: false } to skip
 * capture.ts when a caller does not need it, and { withApi: true } to load the
 * hosted API handlers + server (memory-api; implies withSearch).
 */

const path = require("node:path");

const { loadTsModule } = require("../src/lib/test-utils/load-ts-module.cjs");

const MEM_DIR = path.resolve(__dirname, "../src/lib/memory");
const resolve = (file) => path.join(MEM_DIR, file);

function loadMemoryModules(opts = {}) {
  const { withSearch = false, withCapture = true, withApi = false } = opts;

  // Leaf-first: a module is loaded before anything that stubs it.
  const types = { ALL_VISIBILITIES: ["private", "client", "team", "system"] };
  const embedding = loadTsModule(resolve("embedding.ts"));
  const scope = loadTsModule(resolve("scope.ts"), { stubs: { "./types": types } });
  const migrate = loadTsModule(resolve("migrate.ts"));
  const adapter = loadTsModule(resolve("pglite-adapter.ts"));
  // postgres-adapter only imports the `pg` Client class (no connection opened at
  // load) + type-only ./migrate; backend.ts is pure. Both load stub-free.
  const postgresAdapter = loadTsModule(resolve("postgres-adapter.ts"));
  const backend = loadTsModule(resolve("backend.ts"));
  const rowMappers = loadTsModule(resolve("row-mappers.ts"), {
    stubs: { "./types": types, "./embedding": embedding },
  });
  const store = loadTsModule(resolve("store.ts"), {
    stubs: {
      "./types": types,
      "./migrate": migrate,
      "./scope": scope,
      "./embedding": embedding,
      "./row-mappers": rowMappers,
      "./pglite-adapter": adapter,
      "./postgres-adapter": postgresAdapter,
      "./backend": backend,
    },
  });
  const embedder = loadTsModule(resolve("embedder.ts"));
  const chunker = loadTsModule(resolve("chunker.ts"));
  const discovery = loadTsModule(resolve("discovery.ts"));
  // ingest.ts is the shared single-source pipeline; the indexer and the hosted
  // API both ingest through it.
  const ingest = loadTsModule(resolve("ingest.ts"), {
    stubs: { "./scope": scope, "./embedding": embedding, "./chunker": chunker },
  });
  const indexer = loadTsModule(resolve("indexer.ts"), {
    stubs: { "./scope": scope, "./ingest": ingest, "./discovery": discovery },
  });

  const modules = { types, embedding, scope, migrate, adapter, postgresAdapter, backend, rowMappers, store, embedder, chunker, discovery, ingest, indexer };

  if (withCapture) {
    // capture.ts value-imports only ./indexer; the rest are type-only (erased).
    modules.capture = loadTsModule(resolve("capture.ts"), { stubs: { "./indexer": indexer } });
  }

  if (withSearch || withApi) {
    modules.reranker = loadTsModule(resolve("reranker.ts"));
    modules.search = loadTsModule(resolve("search.ts"), {
      stubs: { "./types": types, "./reranker": modules.reranker, "./row-mappers": rowMappers },
    });
  }

  if (withApi) {
    // api.ts value-imports ./search, ./ingest, ./scope; server.ts only ./api.
    modules.api = loadTsModule(resolve("api.ts"), {
      stubs: { "./types": types, "./search": modules.search, "./ingest": ingest, "./scope": scope },
    });
    modules.server = loadTsModule(resolve("server.ts"), {
      stubs: { "./api": modules.api },
    });
  }

  return modules;
}

module.exports = { loadMemoryModules };
