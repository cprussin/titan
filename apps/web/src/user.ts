/** The single self-hosted athlete's id. v1 is single-user (see the spec's
 *  "Overview"); everything downstream is already keyed by `userId`, so adding
 *  accounts later is a data change, not a rewrite. Must match the id the db
 *  seed script writes. */
export const USER_ID = "default";
