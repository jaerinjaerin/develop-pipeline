import path from "path";

// CLI 번들(bin/cli.js) 기준으로 template/ 위치를 찾는다
// 빌드 후 구조: bin/cli.js, template/
export function getTemplateDir(): string {
  return path.join(__dirname, "..", "template");
}
