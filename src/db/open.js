import * as SQLite from "expo-sqlite";

// Android: a real database file on the phone.
export const openConnection = () => SQLite.openDatabaseAsync("sohana.db");
