// Web demo: sql.js (SQLite compiled to wasm) running in the page, in memory.
//
// Not expo-sqlite on web: its worker always opens an OPFS access-handle pool,
// which only one tab of the site can hold, so a second tab waited forever on
// "Opening your shop". sql.js keeps a private in-memory database per tab, needs
// no worker and no cross-origin isolation headers, and keeps the RAISE text of
// the triggers.
//
// The adapter offers the expo-sqlite calls the app uses: execAsync, runAsync,
// getFirstAsync, getAllAsync and withTransactionAsync. sql-wasm.js and its wasm
// are served from public/ (bundling sql.js pulls in Node's fs).

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.initSqlJs) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load " + src));
    document.head.appendChild(s);
  });
}

const flat = (params) => (params.length === 1 && (Array.isArray(params[0]) || (params[0] && typeof params[0] === "object")) ? params[0] : params);

function rows(db, sql, params) {
  const st = db.prepare(sql);
  try {
    st.bind(flat(params));
    const out = [];
    while (st.step()) out.push(st.getAsObject());
    return out;
  } finally {
    st.free();
  }
}

export async function openConnection() {
  await loadScript("/sql-wasm.js");
  const SQL = await window.initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
  const db = new SQL.Database();

  // One transaction at a time; reads between awaits see the open transaction.
  let queue = Promise.resolve();

  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, ...params) {
      db.run(sql, flat(params));
      const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
      return { lastInsertRowId: id, changes: db.getRowsModified() };
    },
    async getFirstAsync(sql, ...params) {
      return rows(db, sql, params)[0] ?? null;
    },
    async getAllAsync(sql, ...params) {
      return rows(db, sql, params);
    },
    withTransactionAsync(fn) {
      const run = queue.then(async () => {
        db.exec("BEGIN");
        try {
          await fn();
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      });
      queue = run.catch(() => {});
      return run;
    },
  };
}
