import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Plus } from 'lucide-react';
const money = value => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
export function BalanceCard({ balance, onDeposit, onActivity }) {
 const [visible,setVisible]=useState(true);
 return <section className="balance-card" aria-label="Saldo disponible">
   <div className="balance-head"><span>Dinero disponible</span><button onClick={()=>setVisible(v=>!v)} aria-label={visible?'Ocultar saldo':'Mostrar saldo'}>{visible?<Eye size={19}/>:<EyeOff size={19}/>}</button></div>
   <div className="balance-value">{visible ? money(balance) : '$ ••••••••'}</div>
   <div className="yield-row"><span className="spark">✦</span><span>Tu dinero está generando rendimiento</span></div>
   <div className="balance-actions"><button className="button primary" onClick={onDeposit}><Plus size={18}/>Ingresar dinero</button><button className="button ghost" onClick={onActivity}>Ver actividad <ArrowRight size={17}/></button></div>
 </section>;
}
