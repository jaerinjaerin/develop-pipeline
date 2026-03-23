export interface AgentMeta {
  id: string;
  emoji: string;
  name: string;
  role: string;
  workingColor: string;
}

export const AGENTS: AgentMeta[] = [
  { id: "alex", emoji: "🦁", name: "Alex", role: "PM", workingColor: "#8b5cf6" },
  { id: "mina", emoji: "🦉", name: "Mina", role: "기획", workingColor: "#8b5cf6" },
  { id: "lena", emoji: "🦋", name: "Lena", role: "디자인", workingColor: "#34d399" },
  { id: "jay", emoji: "🦊", name: "Jay", role: "FE", workingColor: "#34d399" },
  { id: "sam", emoji: "🐻", name: "Sam", role: "BE", workingColor: "#34d399" },
  { id: "dex", emoji: "🐺", name: "Dex", role: "Infra", workingColor: "#34d399" },
  { id: "eva", emoji: "🐱", name: "Eva", role: "QA", workingColor: "#34d399" },
  { id: "rex", emoji: "🐍", name: "Rex", role: "보안", workingColor: "#8b5cf6" },
  { id: "nora", emoji: "🦅", name: "Nora", role: "리뷰", workingColor: "#34d399" },
];

export const AGENT_MAP = Object.fromEntries(AGENTS.map((a) => [a.id, a]));

export const PHASE_NAMES = ["인풋", "기획", "설계", "구현", "QA"] as const;

export const ACTIVITY_TAG: Record<string, { label: string; color: string }> = {
  success: { label: "완료", color: "#34d399" },
  progress: { label: "진행", color: "#a5b4fc" },
  info: { label: "info", color: "#a5b4fc" },
  error: { label: "에러", color: "#ef4444" },
};
