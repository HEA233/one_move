import { loadLocalEnvironment } from "./config/environment";
import { runAiSmoke } from "./ai/smoke";
loadLocalEnvironment();
const result = await runAiSmoke("image", process.env);
process.stdout.write(`${JSON.stringify(result)}\n`);
if (result.status === "FAIL") process.exitCode = 1;
