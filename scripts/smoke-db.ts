import { loadLocalEnvironment } from "./config/environment";
import { runDatabaseSmoke } from "./database/smoke";
loadLocalEnvironment();
try {
  const result = await runDatabaseSmoke(process.env);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status === "FAIL") process.exitCode = 1;
} catch {
  process.stderr.write("FAIL: Could not initialize the database smoke tool.\n");
  process.exitCode = 1;
}
