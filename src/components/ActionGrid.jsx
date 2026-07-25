export function ActionGrid({ items, onSelect, variant = 'actions' }) {
 return <div className={`action-grid ${variant}`}>{items.map(({id,title,icon:Icon})=><button className="action-item" key={id} onClick={()=>onSelect?.(title)}><span className="action-icon"><Icon size={22} strokeWidth={1.9}/></span><span>{title}</span></button>)}</div>;
}