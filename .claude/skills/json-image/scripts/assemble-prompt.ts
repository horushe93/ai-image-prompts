import fs from "node:fs";
import path from "node:path";

interface PromptTemplate {
  style_name: string;
  style_summary: string;
  environment_variables: Record<string, string>;
  [key: string]: unknown;
}

interface ExampleCase {
  case_name: string;
  environment_variables: Record<string, string>;
}

interface ExampleCases {
  [key: string]: ExampleCase[];
}

function parseArgs(): {
  template: string;
  cases: string;
  ratioKey: string;
  outputDir: string;
  aspectRatio: string;
} {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i].replace(/^--/, "");
    const value = args[i + 1];
    if (!value) {
      console.error(`Missing value for flag: ${args[i]}`);
      process.exit(1);
    }
    parsed[flag] = value;
  }

  for (const key of ["template", "cases", "ratio-key", "output-dir", "aspect-ratio"]) {
    if (!parsed[key]) {
      console.error(`Missing required flag: --${key}`);
      process.exit(1);
    }
  }

  return {
    template: parsed["template"],
    cases: parsed["cases"],
    ratioKey: parsed["ratio-key"],
    outputDir: parsed["output-dir"],
    aspectRatio: parsed["aspect-ratio"],
  };
}

function readJSON(filePath: string): unknown {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    console.error(`Invalid JSON in: ${filePath}`);
    process.exit(1);
  }
}

function main(): void {
  const config = parseArgs();

  const template = readJSON(config.template) as PromptTemplate;
  const cases = readJSON(config.cases) as ExampleCases;

  const casesKey = `example_cases_${config.ratioKey}`;
  const caseList = cases[casesKey];

  if (!caseList) {
    const available = Object.keys(cases)
      .filter((k) => k.startsWith("example_cases_"))
      .map((k) => k.replace("example_cases_", "").replace(/_/g, ":"))
      .join(", ");
    console.error(
      `No cases found for key "${casesKey}". Available ratios: ${available || "none"}`,
    );
    process.exit(1);
  }

  if (caseList.length === 0) {
    console.error(`Cases array "${casesKey}" is empty.`);
    process.exit(1);
  }

  fs.mkdirSync(config.outputDir, { recursive: true });

  const manifest: string[] = [];

  caseList.forEach((caseItem, index) => {
    const mergedEnvVars = {
      ...template.environment_variables,
      ...caseItem.environment_variables,
    };

    const merged = {
      ...template,
      environment_variables: mergedEnvVars,
    };

    const indexStr = String(index + 1).padStart(2, "0");
    const mdContent = [
      "| 渠道 | 模型 | 比例 |",
      "|------|------|------|",
      `| Replicate | GPT Image 2 | ${config.aspectRatio} |`,
      "",
      "```json",
      JSON.stringify(merged, null, 2),
      "```",
      "",
    ].join("\n");

    const fileName = `${indexStr}.md`;
    const filePath = path.join(config.outputDir, fileName);
    fs.writeFileSync(filePath, mdContent, "utf-8");
    manifest.push(filePath);
  });

  const manifestPath = path.join(config.outputDir, "manifest.txt");
  fs.writeFileSync(manifestPath, manifest.join("\n") + "\n", "utf-8");

  console.log(`Generated ${manifest.length} prompt file(s) in ${config.outputDir}`);
  console.log(`Manifest: ${manifestPath}`);
  manifest.forEach((f) => console.log(f));
}

main();
