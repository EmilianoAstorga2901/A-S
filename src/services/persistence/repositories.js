import { createRepository } from './storage.js';

const profileStore = createRepository('prisma.investorProfile.v1', null);
const interactionStore = createRepository('prisma.assetInteractions.v1', { seen: {}, saved: {}, discarded: {}, included: {} });
const portfolioStore = createRepository('prisma.simulatedPortfolio.v1', []);

export const profileRepository = {
  getProfile: () => profileStore.get(),
  saveProfile: profile => profileStore.save(profile),
  updateProfile: changes => profileStore.update(profile => ({ ...profile, ...changes, updatedAt: new Date().toISOString() })),
  clearProfile: () => profileStore.clear(),
};

export const interactionRepository = {
  getInteractions: () => interactionStore.get(),
  record(assetId, action) {
    const date = new Date().toISOString();
    return interactionStore.update(current => ({
      ...current,
      seen: { ...current.seen, [assetId]: date },
      [action]: { ...current[action], [assetId]: date },
    }));
  },
  clear: () => interactionStore.clear(),
};

export const portfolioRepository = {
  getPositions: () => portfolioStore.get(),
  addPosition: position => portfolioStore.update(positions => {
    const next = [...positions.filter(item => item.assetId !== position.assetId), position];
    const total = next.reduce((sum, item) => sum + item.simulatedAmount, 0);
    return next.map(item => ({ ...item, portfolioPercentage: total ? Number((item.simulatedAmount / total * 100).toFixed(2)) : 0 }));
  }),
  removePosition: assetId => portfolioStore.update(positions => positions.filter(item => item.assetId !== assetId)),
  clear: () => portfolioStore.clear(),
};
