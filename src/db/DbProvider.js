import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import { SCHEMA } from "./schema";
import { seed } from "./seed";

// The web build is the client demo: an in-memory database, seeded with sample
// data, gone on refresh. The Android build keeps a real file on the phone.
export const DEMO = Platform.OS === "web";

const DbContext = createContext(null);

export function DbProvider({ children, fallback = null }) {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const conn = await SQLite.openDatabaseAsync(DEMO ? ":memory:" : "sohana.db");
        await conn.execAsync(SCHEMA);
        const has = await conn.getFirstAsync("SELECT COUNT(*) AS n FROM items");
        if (!has.n) await seed(conn);
        if (alive) setDb(conn);
      } catch (e) {
        console.warn(e);
        if (alive) setError(e);
      }
    })();
    return () => { alive = false; };
  }, []);

  const changed = useCallback(() => setVersion((v) => v + 1), []);

  if (error) throw error;
  if (!db) return fallback;
  return <DbContext.Provider value={{ db, version, changed }}>{children}</DbContext.Provider>;
}

export const useDb = () => useContext(DbContext);

// Runs a read and re-runs it after any write anywhere in the app.
export function useQuery(fn, deps = []) {
  const { db, version } = useDb();
  const [data, setData] = useState(undefined);
  useEffect(() => {
    let alive = true;
    fn(db).then((r) => alive && setData(r)).catch((e) => console.warn(e));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, ...deps]);
  return data;
}
