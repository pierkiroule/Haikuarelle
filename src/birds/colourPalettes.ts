import type {BirdId} from './catalog';
export interface FeatherColour {name:string;hex:string}
const palette=(entries:[string,string][]):FeatherColour[]=>entries.map(([name,hex])=>({name,hex}));
export const BIRD_COLOURS:Partial<Record<BirdId,readonly FeatherColour[]>>={
 rossignol:palette([['Brun chaud','#846448'],['Roux de la queue','#B46B44'],['Brun olive','#756D50'],['Crème du ventre','#E7DBC3'],['Gris beige','#B2A696'],['Brun sombre','#443B32']]),
 etourneau:palette([['Noir irisé','#252B2C'],['Vert métallique','#416D5D'],['Violet irisé','#635276'],['Crème moucheté','#DED6BC'],['Brun des rémiges','#74604B'],['Jaune du bec','#D7B64B'],['Gris ardoise','#6E797D']]),
 merle:palette([['Noir velouté','#242526'],['Brun sombre','#55463B'],['Gris fumée','#747576'],['Jaune du bec','#E6B735'],['Orange doré','#D68B29'],['Brun clair','#A28A70']]),
 moineau:palette([['Brun châtain','#966444'],['Beige sable','#C7AD83'],['Gris cendré','#98958D'],['Noir bavette','#292A28'],['Brun rayé','#66503B'],['Blanc crème','#EDE6D7']]),
 mesange:palette([['Bleu azur','#2461B6'],['Bleu nuit','#17375E'],['Bleu gris','#6C91B1'],['Jaune citron','#F2CF38'],['Vert olive','#77A94D'],['Blanc crème','#F5F0D9'],['Gris doux','#A9A9A0'],['Anthracite','#25282A']]),
 rougegorge:palette([['Orange roux','#D66A38'],['Fauve doré','#B89165'],['Brun olive','#777451'],['Brun sombre','#514438'],['Gris chaud','#A6A399'],['Blanc crème','#EEE7D5'],['Noir brun','#302B27']]),
 geai:palette([['Rose brun','#BD9283'],['Beige rosé','#D4B5A1'],['Brun chaud','#94705B'],['Bleu vif','#438FCB'],['Bleu sombre','#284E70'],['Gris perle','#ADAFAB'],['Blanc ivoire','#F1EEE4'],['Noir','#272829']]),
 bouvreuil:palette([['Rose corail','#D66C77'],['Rouge rosé','#BD5265'],['Gris cendré','#92999E'],['Gris ardoise','#65737F'],['Brun rosé','#A48B7E'],['Blanc crème','#EEE9DD'],['Noir velouté','#25272B']]),
 sittelle:palette([['Bleu ardoise','#748FA3'],['Gris bleuté','#9BACB5'],['Roux orangé','#CE874A'],['Cannelle','#AE653D'],['Beige chamois','#DFC19A'],['Blanc crème','#F1EBDD'],['Noir','#292A29']]),
 picvert:palette([['Vert mousse','#688744'],['Vert olive','#8E9A48'],['Jaune doré','#D5BE45'],['Rouge carmin','#BE3940'],['Gris vert','#A6AE91'],['Blanc crème','#EAE8D7'],['Brun sombre','#655B43'],['Noir','#292D28']]),
 corneille:palette([['Noir profond','#1D2022'],['Anthracite','#30363B'],['Gris charbon','#4B535B'],['Ardoise bleutée','#425869'],['Violet sombre','#494252'],['Gris argenté','#828B91']]),
 pie:palette([['Noir profond','#202426'],['Blanc ivoire','#F2F0E7'],['Bleu acier','#365F80'],['Bleu cobalt sombre','#294C86'],['Vert pétrole','#285B54'],['Turquoise sombre','#397A78'],['Violet irisé','#574364'],['Gris argenté','#A8B0B1']]),
};
