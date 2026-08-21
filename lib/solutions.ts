import raw from './generated-solutions.json';

export interface SolutionWalkthrough {
  approach: string;
  solutionCode: string;
  references: string;
}

const SOLUTIONS = raw as Record<string, SolutionWalkthrough>;

export function getSolution(id: number): SolutionWalkthrough | null {
  return SOLUTIONS[String(id)] ?? null;
}

// Attribution required by CC-BY-4.0.
export const SOLUTIONS_SOURCE_URL = 'https://github.com/ghaiklor/type-challenges-solutions';
