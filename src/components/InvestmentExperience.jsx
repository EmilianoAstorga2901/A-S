import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Info, LockKeyhole, RotateCcw, ShieldCheck, Sparkles, Target, TrendingUp, WalletCards } from 'lucide-react';
import { calculateProfile, questionnaire } from '../data/investmentProfile';
import { profileRepository } from '../services/persistence/repositories';

function Intro({ onStart, onBack, onExplore }) {
  return <div className="invest-screen intro-screen">
    <div className="invest-header"><button className="round-back" onClick={onBack} aria-label="Volver al inicio"><ArrowLeft size={20}/></button><span className="brand-mark">PRISMA</span><span className="header-spacer"/></div>
    <div className="intro-hero">
      <div className="intro-visual"><span className="visual-ring ring-a"/><span className="visual-ring ring-b"/><div className="visual-core"><TrendingUp size={34}/></div><span className="floating-icon icon-one"><Target size={18}/></span><span className="floating-icon icon-two"><ShieldCheck size={18}/></span></div>
      <span className="intro-kicker"><Sparkles size={13}/> PERFIL DE INVERSIÓN</span>
      <h1>Inversiones pensadas<br/>para vos</h1>
      <p>Antes de explorar el mercado, queremos entender tus objetivos y cómo te sentís frente al riesgo.</p>
    </div>
    <div className="intro-features">
      <div><span><Clock3 size={20}/></span><p><strong>Solo unos minutos</strong><small>Preguntas simples y transparentes</small></p></div>
      <div><span><ShieldCheck size={20}/></span><p><strong>Sin respuestas correctas</strong><small>Tu situación es única</small></p></div>
      <div><span><LockKeyhole size={20}/></span><p><strong>Información protegida</strong><small>Podés cambiarla cuando quieras</small></p></div>
    </div>
    <div className="invest-footer"><button className="continue-button" onClick={onStart}>Crear mi primera cartera <ArrowRight size={18}/></button><button className="outline-wide-button" onClick={onExplore}>Explorar inversiones</button><p>Esto es una simulación educativa y no constituye asesoramiento financiero.</p></div>
  </div>;
}

function Question({ index, answers, onAnswer, onNext, onPrevious, onExit }) {
  const question = questionnaire[index];
  const selected = answers[question.id];
  const progress = ((index + 1) / questionnaire.length) * 100;
  return <div className="invest-screen question-screen">
    <div className="question-top">
      <button className="round-back" onClick={index === 0 ? onExit : onPrevious} aria-label="Volver"><ArrowLeft size={20}/></button>
      <div className="progress-wrap"><div className="progress-meta"><span>{question.section}</span><span>{index + 1} de {questionnaire.length}</span></div><div className="progress-track"><i style={{width:`${progress}%`}}/></div></div>
      <span className="header-spacer"/>
    </div>
    <div className="question-content">
      <span className="question-eyebrow">{question.eyebrow}</span>
      <h1>{question.title}</h1>
      <p>{question.helper}</p>
      <div className="answer-list" role="radiogroup" aria-label={question.title}>
        {question.options.map(option => <button key={option.value} role="radio" aria-checked={selected === option.value} className={selected === option.value ? 'answer selected' : 'answer'} onClick={() => onAnswer(question.id, option.value)}>
          <span className="radio-dot">{selected === option.value && <Check size={14}/>}</span>
          <span className="answer-copy"><strong>{option.label}</strong>{option.detail && <small>{option.detail}</small>}</span>
          <ChevronRight className="answer-chevron" size={18}/>
        </button>)}
      </div>
    </div>
    <div className="question-footer"><div className="privacy-note"><LockKeyhole size={13}/> Tus respuestas son privadas y están protegidas.</div><button className="continue-button" disabled={!selected} onClick={onNext}>{index === questionnaire.length - 1 ? 'Ver mi resultado' : 'Continuar'} <ArrowRight size={18}/></button></div>
  </div>;
}

function ScoreBar({ label, value, subtitle }) {
  const percent = Math.round((value / 3) * 100);
  return <div className="score-item"><div><strong>{label}</strong><span>{subtitle}</span></div><div className="score-line"><i style={{width:`${percent}%`}}/></div><b>{percent}%</b></div>;
}

function Result({ result, onRestart, onHome }) {
  return <div className="invest-screen result-screen">
    <div className="invest-header"><button className="round-back" onClick={onHome} aria-label="Volver al inicio"><ArrowLeft size={20}/></button><span className="brand-mark">TU RESULTADO</span><button className="round-back" onClick={onRestart} aria-label="Repetir test"><RotateCcw size={18}/></button></div>
    <section className="result-hero">
      <div className="result-icon" style={{'--profile-color':result.color}}><Sparkles size={29}/></div>
      <span>Tu perfil de inversión es</span><h1>{result.name}</h1>
      <div className="risk-chip" style={{color:result.color,background:`${result.color}12`}}><i style={{background:result.color}}/> Riesgo {result.tone.toLowerCase()}</div>
      <p>{result.summary}</p>
    </section>
    <section className="dimensions-card">
      <div className="card-heading"><div><span className="section-icon"><Target size={18}/></span><div><h2>Tu perfil en dos dimensiones</h2><p>Combinamos lo que podés asumir con lo que te hace sentir cómodo.</p></div></div><Info size={16}/></div>
      <ScoreBar label="Capacidad financiera" value={result.capacity} subtitle="Situación objetiva"/>
      <ScoreBar label="Tolerancia emocional" value={result.tolerance} subtitle="Cómo reaccionás al riesgo"/>
    </section>
    <section className="portfolio-card">
      <div className="card-heading"><div><span className="section-icon"><WalletCards size={18}/></span><div><h2>Una cartera para explorar</h2><p>Distribución orientativa según tus respuestas.</p></div></div></div>
      <div className="allocation-bar">{result.allocation.map(asset=><i key={asset.name} style={{width:`${asset.percentage}%`,background:asset.color}}/>)}</div>
      <div className="allocation-list">{result.allocation.map(asset=><details key={asset.name}><summary><i style={{background:asset.color}}/><span>{asset.name}</span><strong>{asset.percentage}%</strong><ChevronRight size={16}/></summary><p>{asset.reason}</p></details>)}</div>
    </section>
    <div className="result-notice"><Info size={18}/><p><strong>Una guía, no una garantía</strong><span>Esta propuesta es educativa y no asegura rendimientos. Antes de invertir, vas a poder revisar cada activo.</span></p></div>
    <div className="result-actions"><button className="continue-button" onClick={onHome}>Explorar con mi perfil <ArrowRight size={18}/></button><button className="text-button" onClick={onRestart}>Volver a hacer el test</button></div>
  </div>;
}

export function InvestmentExperience({ onClose, onExplore }) {
  const [stage, setStage] = useState('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const result = useMemo(() => calculateProfile(answers), [answers]);
  const start = () => { setIndex(0); setStage('question'); };
  const restart = () => { setAnswers({}); start(); };
  const next = () => {
    if (index < questionnaire.length - 1) return setIndex(value => value + 1);
    const calculated = calculateProfile(answers);
    profileRepository.saveProfile({ ...calculated, answers, capacityLabel: calculated.capacity < 1.15 ? 'Baja' : calculated.capacity < 2.15 ? 'Media' : 'Alta', toleranceLabel: calculated.tolerance < 1.15 ? 'Baja' : calculated.tolerance < 2.15 ? 'Media' : 'Alta', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setStage('result');
  };
  if (stage === 'intro') return <Intro onStart={start} onBack={onClose} onExplore={onExplore}/>;
  if (stage === 'result') return <Result result={result} onRestart={restart} onHome={onExplore}/>;
  return <Question index={index} answers={answers} onAnswer={(id,value)=>setAnswers(current=>({...current,[id]:value}))} onNext={next} onPrevious={()=>setIndex(value=>value-1)} onExit={()=>setStage('intro')}/>;
}
