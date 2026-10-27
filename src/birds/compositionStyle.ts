export const COMPOSITION_FONTS={serif:{label:'Poétique',family:'Georgia, serif',canvas:'Georgia'},book:{label:'Littéraire',family:'"Palatino Linotype", "Book Antiqua", Palatino, serif',canvas:'"Palatino Linotype", "Book Antiqua", Palatino, serif'},sans:{label:'Épurée',family:'Arial, sans-serif',canvas:'Arial'}} as const;
export interface TextAppearance{font:keyof typeof COMPOSITION_FONTS;color:string;align:'left'|'center'|'right'}
export const DEFAULT_TEXT:TextAppearance={font:'serif',color:'#35483e',align:'left'};
export type CompositionElement='painting'|'title'|'haiku';
