import { ArrowUpRight, ChevronRight, TrendingUp } from 'lucide-react';
export function InvestmentCard({ user, onOpen }) { return <section className="investment-card">
 <div className="investment-top"><div className="mini-label"><span className="chart-icon"><TrendingUp size={18}/></span> TU PERFIL DE INVERSIÓN</div><button aria-label="Ver inversiones" onClick={onOpen}><ChevronRight size={21}/></button></div>
 <div className="profile-line"><h2>{user.riskProfile}</h2><span>Balance inteligente</span></div>
 <p>Tu cartera busca equilibrar crecimiento y estabilidad.</p>
 <div className="return-box"><div><small>Rendimiento este mes</small><strong>+${user.monthlyReturn.toLocaleString('es-AR',{minimumFractionDigits:2})}</strong></div><div className="return-pill"><ArrowUpRight size={14}/> 2,4%</div></div>
 <div className="investment-actions"><button onClick={onOpen}>Ver mi cartera</button><button>Cambiar perfil</button></div>
 </section> }