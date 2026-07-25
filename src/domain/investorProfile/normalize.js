const levels = value => value < 1.15 ? 'Baja' : value < 2.15 ? 'Media' : 'Alta';
const mapAnswer = (answers, id, values) => values[answers[id]] ?? 50;

export function normalizeProfile(savedProfile) {
  if (!savedProfile) return { risk:50,horizon:50,liquidity:70,knowledge:35,financialCapacity:50,goal:'education',capacityLabel:'Sin evaluar',toleranceLabel:'Sin evaluar' };
  const { answers = {}, capacity = 1.5, tolerance = 1.5 } = savedProfile;
  return {
    risk:Math.round(((capacity * .6 + tolerance * .4) / 3) * 100),
    horizon:mapAnswer(answers,'horizon',{short:10,medium:35,long:70,'very-long':95}),
    liquidity:mapAnswer(answers,'liquidity',{essential:100,week:75,months:40,none:15}),
    knowledge:mapAnswer(answers,'knowledge',{basic:20,funds:45,stocks:70,advanced:95}),
    financialCapacity:Math.round(capacity/3*100), goal:answers.goal ?? 'education',
    capacityLabel:levels(capacity), toleranceLabel:levels(tolerance),
  };
}
