import { Check, CircleHelp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createProfile } from '../api';
import {
  applyGoalVectorToProfile,
  explanationLevelForExperience,
  profileQuestions,
  questionForLevel,
  toProfilePayload,
} from '../profile';
import {
  appendKnowledgeHistory,
  evaluateKnowledgeResponses,
  mergeKnowledgeIntoProfile,
  selectAdaptiveQuestions,
  selectGatewayQuestions,
} from '../knowledgeEngine';
import { buildInvestorMap } from '../investorMap';

function MoneyAnswer({ value = {}, onChange, allowUnsure = false }) {
  const update = (patch) => onChange({ currency: 'ARS', amount: '', unsure: false, ...value, ...patch });
  return (
    <div className="money-answer">
      <div className="money-entry">
        <select
          value={value.currency || 'ARS'}
          onChange={(event) => update({ currency: event.target.value, unsure: false })}
          aria-label="Moneda"
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
        <input
          inputMode="decimal"
          type="number"
          min="0"
          placeholder="Ingresá un monto"
          value={value.amount || ''}
          disabled={Boolean(value.unsure)}
          onChange={(event) => update({ amount: event.target.value, unsure: false })}
        />
      </div>
      {allowUnsure && (
        <button
          type="button"
          className={`unsure-choice ${value.unsure ? 'selected' : ''}`}
          onClick={() => update({ unsure: !value.unsure, amount: '' })}
        >
          <span>Todavía no estoy seguro</span>
          <i>{value.unsure && <Check size={13} />}</i>
        </button>
      )}
    </div>
  );
}

function OptionAnswer({ question, value, onChange }) {
  const selectedValues = Array.isArray(value) ? value : [];
  const isMulti = question.type === 'multi' || question.type === 'sectors';
  const max = question.type === 'sectors' ? 3 : Number.POSITIVE_INFINITY;

  const toggle = (optionValue) => {
    if (!isMulti) {
      onChange(optionValue);
      return;
    }
    if (optionValue === 'none') {
      onChange(selectedValues.includes('none') ? [] : ['none']);
      return;
    }
    const withoutNone = selectedValues.filter((item) => item !== 'none');
    if (withoutNone.includes(optionValue)) {
      onChange(withoutNone.filter((item) => item !== optionValue));
      return;
    }
    if (withoutNone.length < max) onChange([...withoutNone, optionValue]);
  };

  return (
    <>
      <div className="answer-list">
        {question.options.map(([optionValue, label]) => {
          const selected = isMulti ? selectedValues.includes(optionValue) : value === optionValue;
          const blocked = question.type === 'sectors'
            && optionValue !== 'none'
            && !selected
            && selectedValues.filter((item) => item !== 'none').length >= max;
          return (
            <button
              key={String(optionValue)}
              type="button"
              className={selected ? 'selected' : ''}
              disabled={blocked}
              onClick={() => toggle(optionValue)}
            >
              <span>{label}</span>
              <i>{selected && <Check size={13} />}</i>
            </button>
          );
        })}
      </div>
      {question.type === 'sectors' && (
        <div className="selection-counter">
          <b>{selectedValues.filter((item) => item !== 'none').length}/3 sectores</b>
          <span>Para elegir otro, primero quitá uno.</span>
        </div>
      )}
    </>
  );
}

function QuestionAnswer({ question, value, onChange }) {
  if (question.type === 'money') {
    return <MoneyAnswer value={value} onChange={onChange} allowUnsure={question.allowUnsure} />;
  }
  if (question.type === 'number') {
    return (
      <div className="single-input">
        <input
          type="number"
          inputMode="numeric"
          min={question.min}
          max={question.max}
          placeholder={question.placeholder}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }
  return <OptionAnswer question={question} value={value} onChange={onChange} />;
}

function readKnowledgeHistory() {
  try {
    return JSON.parse(localStorage.getItem('prisma-knowledge-history')) || [];
  } catch {
    return [];
  }
}

export function Onboarding({ BackHeader, onCancel, onComplete, initialResult = null }) {
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState('profile');
  const [answers, setAnswers] = useState(() => ({ products: [], sectors: [], ...(initialResult?.answers || {}) }));
  const [knowledgeHistory] = useState(readKnowledgeHistory);
  const [gatewayQuestions] = useState(() => selectGatewayQuestions(knowledgeHistory));
  const [knowledgeQuestions, setKnowledgeQuestions] = useState(() => selectGatewayQuestions(knowledgeHistory));
  const [knowledgeStep, setKnowledgeStep] = useState(0);
  const [knowledgeResponses, setKnowledgeResponses] = useState({});
  const [adaptiveReady, setAdaptiveReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeProfileQuestions = useMemo(() => profileQuestions.filter((item) => (
    !item.when || answers[item.when.key] === item.when.equals
  )), [answers]);
  const essentialTotal = activeProfileQuestions.filter((item) => item.group === 'essential').length;
  const optionalTotal = activeProfileQuestions.filter((item) => item.group === 'optional').length;
  const baseQuestion = stage === 'profile' ? activeProfileQuestions[step] : null;
  const explanationLevel = explanationLevelForExperience(answers.experience);
  const question = stage === 'profile'
    ? questionForLevel(baseQuestion, explanationLevel)
    : stage === 'knowledge'
      ? knowledgeQuestions[knowledgeStep]
      : null;
  const essentialIndex = activeProfileQuestions.slice(0, step + 1).filter((item) => item.group === 'essential').length;
  const optionalIndex = activeProfileQuestions.slice(0, step + 1).filter((item) => item.group === 'optional').length;
  const stepLabel = stage === 'knowledge-intro'
    ? 'Cómo vamos a adaptar las explicaciones'
    : stage === 'knowledge'
      ? `Conocimiento ${knowledgeStep + 1} de ${knowledgeQuestions.length}`
      : question.key === 'experience'
        ? 'Antes de empezar'
        : question.group === 'essential'
          ? `Esencial ${essentialIndex} de ${essentialTotal}`
          : question.group === 'preference'
            ? 'Preferencias opcionales'
            : `Opcional ${optionalIndex} de ${optionalTotal}`;

  const value = stage === 'knowledge' ? knowledgeResponses[question.id] : stage === 'profile' ? answers[question.key] : null;
  const canContinue = useMemo(() => {
    if (stage === 'knowledge-intro') return true;
    if (stage === 'knowledge') return value !== undefined && value !== null && value !== '';
    if (question.group !== 'essential') return true;
    if (question.type === 'money') return Boolean(value?.unsure || Number(value?.amount) > 0);
    return value !== undefined && value !== null && value !== '';
  }, [question, stage, value]);

  const completeProfile = async () => {
    setIsSubmitting(true);
    const payload = toProfilePayload(answers);
    const baseProfile = applyGoalVectorToProfile(await createProfile(payload, answers), answers);
    const knowledge = evaluateKnowledgeResponses(knowledgeResponses);
    const profile = mergeKnowledgeIntoProfile(baseProfile, knowledge);
    const result = {
      profile,
      answers,
      knowledge,
      knowledgeResponses,
      investorMap: buildInvestorMap({ profile, answers, knowledge, previousMap: initialResult?.investorMap }),
      ...(initialResult?.demo ? { demo: initialResult.demo } : {}),
    };
    const nextHistory = appendKnowledgeHistory(knowledgeHistory, Object.keys(knowledgeResponses));
    localStorage.setItem('prisma-knowledge-history', JSON.stringify(nextHistory));
    localStorage.setItem('prisma-profile-result', JSON.stringify(result));
    setIsSubmitting(false);
    onComplete(result);
  };

  const next = async () => {
    if (stage === 'profile' && step < activeProfileQuestions.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    if (stage === 'profile') {
      setStage('knowledge-intro');
      return;
    }
    if (stage === 'knowledge-intro') {
      setStage('knowledge');
      return;
    }
    const reachedGatewayEnd = knowledgeStep === gatewayQuestions.length - 1 && !adaptiveReady;
    if (reachedGatewayEnd) {
      const adaptiveQuestions = selectAdaptiveQuestions(knowledgeResponses, gatewayQuestions, knowledgeHistory);
      setKnowledgeQuestions([...gatewayQuestions, ...adaptiveQuestions]);
      setAdaptiveReady(true);
      setKnowledgeStep((current) => current + 1);
      return;
    }
    if (knowledgeStep < knowledgeQuestions.length - 1) {
      setKnowledgeStep((current) => current + 1);
      return;
    }
    await completeProfile();
  };

  const goBack = () => {
    if (stage === 'knowledge' && knowledgeStep > 0) {
      setKnowledgeStep((current) => current - 1);
      return;
    }
    if (stage === 'knowledge') {
      setStage('knowledge-intro');
      return;
    }
    if (stage === 'knowledge-intro') {
      setStage('profile');
      setStep(activeProfileQuestions.length - 1);
      return;
    }
    if (step === 0) onCancel();
    else setStep((current) => current - 1);
  };

  const updateAnswer = (nextValue) => {
    if (stage === 'knowledge') {
      setKnowledgeResponses((current) => ({ ...current, [question.id]: nextValue }));
      return;
    }
    setAnswers((current) => ({ ...current, [question.key]: nextValue }));
  };

  const progressCurrent = stage === 'profile'
    ? step + 1
    : stage === 'knowledge-intro'
      ? activeProfileQuestions.length
      : activeProfileQuestions.length + knowledgeStep + 1;
  const progressTotal = activeProfileQuestions.length + (stage === 'knowledge' ? knowledgeQuestions.length : 3);

  return (
    <>
      <BackHeader title="Crear mi cartera" subtitle={stepLabel} onBack={goBack} />
      <div className="progress" aria-label={`Paso ${progressCurrent} de ${progressTotal}`}>
        <i style={{ width: `${Math.min(100, (progressCurrent / progressTotal) * 100)}%` }} />
      </div>
      {stage === 'knowledge-intro' ? (
        <section className="question question-complete knowledge-intro">
          <span>NO ES UNA AUTOEVALUACIÓN</span>
          <h2>Ahora veamos cómo preferís aprender</h2>
          <p><CircleHelp size={15} />Vas a resolver 3 minicasos y entre 3 y 6 preguntas adaptativas. Si algo no lo sabés, elegí “No sé”: esa respuesta nos ayuda a explicarlo mejor.</p>
          <div className="knowledge-rules">
            <div><b>No cambia tu riesgo</b><span>El conocimiento nunca habilita una cartera más agresiva.</span></div>
            <div><b>No se repite siempre igual</b><span>Prisma rota preguntas y profundiza donde hay más incertidumbre.</span></div>
            <div><b>Se puede corregir</b><span>Después vas a poder elegir explicaciones simples, intermedias o avanzadas.</span></div>
          </div>
        </section>
      ) : (
        <section className={`question question-complete ${stage === 'knowledge' ? 'knowledge-question' : ''}`}>
          <span>{stage === 'knowledge' ? 'Solo adapta cómo se explica' : question.key === 'experience' ? 'Solo ajusta cómo te explicamos' : question.group === 'essential' ? 'Necesario para recomendar' : 'Podés omitir esta pregunta'}</span>
          <h2>{question.title}</h2>
          {question.helper && <p><CircleHelp size={15} />{question.helper}</p>}
          {question.whyWeAsk && (
            <details className="why-we-ask">
              <summary>¿Por qué preguntamos esto?</summary>
              <p>{question.whyWeAsk}</p>
            </details>
          )}
          <QuestionAnswer question={question} value={value} onChange={updateAnswer} />
          {stage === 'knowledge' && <small className="knowledge-safety-note">Tu respuesta se guarda como evidencia con nivel de confianza. No modifica capacidad, tolerancia ni límites de cartera.</small>}
        </section>
      )}
      <div className="sticky-action onboarding-action">
        <button type="button" onClick={next} disabled={!canContinue || isSubmitting}>
          {isSubmitting ? 'Calculando…' : stage === 'knowledge-intro' ? 'Empezar minicasos' : stage === 'knowledge' ? 'Continuar' : question.group === 'essential' || value ? 'Continuar' : 'Omitir por ahora'}
        </button>
      </div>
    </>
  );
}
