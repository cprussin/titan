import type { Db } from "@titan/db/client";
import { listProgramVersions } from "@titan/db/program-versions";

/** A lookup from session-template id to display name, across all program
 *  versions, for labeling history entries. */
export const templateNames = async (db: Db): Promise<Map<string, string>> => {
  const versions = await listProgramVersions(db);
  return new Map(
    versions.flatMap((version) =>
      version.sessionTemplates.map((template) => [template.id, template.name]),
    ),
  );
};
