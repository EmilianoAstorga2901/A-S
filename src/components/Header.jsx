import { Bell, CircleHelp } from 'lucide-react';
export function Header({ user, onNotify }) {
  return <header className="header">
    <div className="avatar" aria-label={`Avatar de ${user.name}`}>{user.initials}</div>
    <div className="greeting"><span>Hola, {user.name} <span aria-hidden="true">👋</span></span><h1>¿Qué querés hacer hoy?</h1></div>
    <div className="header-actions"><button className="icon-button notification" aria-label="Notificaciones" onClick={onNotify}><Bell size={20}/><i /></button><button className="icon-button" aria-label="Ayuda"><CircleHelp size={20}/></button></div>
  </header>;
}