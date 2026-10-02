import { environmentSchema as schema, loadLocalEnvironment } from "./config/environment";

loadLocalEnvironment();

const names = Object.keys(schema.shape) as Array<keyof typeof schema.shape>;
const environment = Object.fromEntries(names.map((name) => [name, process.env[name]]));
const result = schema.safeParse(environment);
const invalidNames = new Set(
  result.success ? [] : result.error.issues.map((issue) => String(issue.path[0])),
);

for (const name of names) {
  const value = environment[name];
  const status = invalidNames.has(name)
    ? "invalid"
    : typeof value === "string" && value.length > 0
      ? "configured"
      : "missing";
  process.stdout.write(`${name}: ${status}\n`);
}

if (invalidNames.size > 0) {
  process.exitCode = 1;
}
