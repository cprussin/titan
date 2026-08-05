import type { Program, ProgramVersion } from "@titan/domain/program";
import { programVersionSchema } from "@titan/domain/program";
import type { Db } from "./client";
import { parseDataRows, parseFirstDataRow } from "./parse-rows";

export const getProgramVersion = async (
  db: Db,
  id: string,
): Promise<ProgramVersion | undefined> => {
  const rows = await db<
    { data: unknown }[]
  >`SELECT data FROM program_versions WHERE id = ${id}`;
  return parseFirstDataRow(programVersionSchema, rows);
};

export const listProgramVersions = async (
  db: Db,
): Promise<ProgramVersion[]> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM program_versions ORDER BY program_id, version
  `;
  return parseDataRows(programVersionSchema, rows);
};

export const upsertProgram = async (
  db: Db,
  program: Program,
): Promise<void> => {
  await db`
    INSERT INTO programs (id, data) VALUES (${program.id}, ${db.json(program)})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
};

export const upsertProgramVersion = async (
  db: Db,
  version: ProgramVersion,
): Promise<void> => {
  await db`
    INSERT INTO program_versions (id, program_id, version, data)
    VALUES (
      ${version.id},
      ${version.programId},
      ${version.version},
      ${db.json(version)}
    )
    ON CONFLICT (id) DO UPDATE SET
      program_id = EXCLUDED.program_id,
      version = EXCLUDED.version,
      data = EXCLUDED.data
  `;
};
