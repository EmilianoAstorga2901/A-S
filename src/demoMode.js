import { calculateProfile } from './profile.js';
import { evaluateKnowledgeResponses, mergeKnowledgeIntoProfile } from './knowledgeEngine.js';
import { buildInvestorMap } from './investorMap.js';

export const DEMO_VERSION = 'demo_v1.0';

export const prismaLocalStorageKeys = [
  'prisma-profile-result',
  'prisma-asset-states',
  'prisma-knowledge-history',
  'prisma-demo-mode',
];

export const prismaSessionStorageKeys = [
  'prisma-explore-position',
  'prisma-explore-return',
  'prisma-explore-origin',
  'prisma-review-return',
];

export function createDemoProfileResult(now = new Date().toISOString()) {
  const answers = {
    experience: 'low',
    goal: 'retirement',
    horizon: 'gt10',
    liquidity: 'small',
    emergencyFund: 'yes',
    debts: 'none',
    income: 'stable_regular',
    reaction: 'hold',
    lossTolerance: 20,
    contribution: { currency: 'USD', amount: '200', unsure: false },
    age: '22',
    initialAmount: { currency: 'USD', amount: '500', unsure: false },
    products: ['funds', 'stocks'],
    sectors: ['Tecnología', 'Salud'],
  };
  const knowledgeResponses = {
    'gate-risk-div-1': 'b',
    'gate-liquidity-instruments-1': 'a',
    'gate-inflation-costs-1': 'unknown',
    'inflation-fx-1': 'a',
    'costs-1': 'a',
    'diversification-1': 'b',
    'risk-2': 'a',
  };
  const knowledge = evaluateKnowledgeResponses(knowledgeResponses);
  knowledge.assessedAt = now;
  const baseProfile = calculateProfile(answers);
  const profile = mergeKnowledgeIntoProfile(baseProfile, knowledge);
  return {
    profile,
    answers,
    knowledge,
    knowledgeResponses,
    investorMap: buildInvestorMap({ profile, answers, knowledge, now }),
    demo: {
      active: true,
      version: DEMO_VERSION,
      caseName: 'Joven que empieza a invertir para su jubilación',
      description: '22 años · USD 200 por mes · prioridad de seguridad · conocimiento en desarrollo',
      createdAt: now,
    },
  };
}

export function clearPrismaStorage(local = globalThis.localStorage, session = globalThis.sessionStorage) {
  prismaLocalStorageKeys.forEach((key) => local?.removeItem(key));
  prismaSessionStorageKeys.forEach((key) => session?.removeItem(key));
}
