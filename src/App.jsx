import { useState } from 'react';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { ActionGrid } from './components/ActionGrid';
import { InvestmentCard } from './components/InvestmentCard';
import { PromotionCard } from './components/PromotionCard';
import { BottomNav } from './components/BottomNav';
import { InvestmentExperience } from './components/InvestmentExperience';
import { ExploreScreen } from './screens/ExploreScreen';
import { quickActions, services, user } from './data/mockData';

function SectionTitle({children,action}){return <div className="section-title"><h2>{children}</h2>{action&&<button>{action}</button>}</div>}
export default function App(){
 const [active,setActive]=useState('Inicio'); const [investmentRoute,setInvestmentRoute]=useState('entry'); const [toast,setToast]=useState('');
 const openInvestments=()=>{setInvestmentRoute('entry');setActive('Invertir')};
 if(active==='Invertir') return <div className="app-shell investment-shell">{investmentRoute==='explore'?<ExploreScreen onBack={()=>setInvestmentRoute('entry')} onCreateProfile={()=>setInvestmentRoute('entry')}/>:<InvestmentExperience onClose={()=>setActive('Inicio')} onExplore={()=>setInvestmentRoute('explore')}/>}</div>;
 const inform=(message)=>{setToast(message);window.clearTimeout(inform.timer);inform.timer=window.setTimeout(()=>setToast(''),2200)};
 return <div className="app-shell"><main className="phone-content"><div className="page-top"><Header user={user} onNotify={()=>inform('No tenés notificaciones nuevas')}/><BalanceCard balance={user.balance} onDeposit={()=>inform('Ingresar dinero')} onActivity={()=>setActive('Actividad')}/></div><SectionTitle>Acciones rápidas</SectionTitle><ActionGrid items={quickActions} onSelect={inform}/><SectionTitle action="Ver todos">Servicios</SectionTitle><ActionGrid items={services} variant="services" onSelect={inform}/><InvestmentCard user={user} onOpen={openInvestments}/><SectionTitle action="Ver todos">Beneficios para vos</SectionTitle><PromotionCard/><p className="legal-note">Los rendimientos son simulados y no garantizan resultados futuros.</p></main><BottomNav active={active} onChange={(name)=>{if(name==='Invertir')openInvestments();else{setActive(name);if(name!=='Inicio')inform(`${name}: próximamente`)}}}/>{toast&&<div className="toast" role="status">{toast}</div>}</div>
}
