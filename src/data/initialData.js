import { syncCardsWithInventory } from "./inventorySync";

export const initialCategories = [
  { id: "6", name: "Champagne", icon: "glass-flute", color: "#C0932A" },
  { id: "7", name: "Rosé", icon: "glass-wine", color: "#E05C8A" },
  { id: "8", name: "Vitt", icon: "glass-wine", color: "#8E9B2F" },
  { id: "9", name: "Rött", icon: "glass-wine", color: "#922B21" },
  { id: "10", name: "Sött", icon: "bottle-wine", color: "#A569BD" },
  { id: "3", name: "Öl", icon: "glass-mug-variant", color: "#F39C12" },
  { id: "4", name: "Cocktails", icon: "glass-cocktail", color: "#1ABC9C" },
  { id: "5", name: "Sprit", icon: "glass-stange", color: "#E74C3C" },
];

function price(g, b) {
  const parts = [];
  if (g) parts.push(`Glas: ${g} kr`);
  if (b) parts.push(`Flaska: ${b} kr`);
  return parts.join(" · ");
}

function grapes(arr) {
  return arr && arr.length ? `Druvor: ${arr.join(", ")}. ` : "";
}

function flavors(arr) {
  return arr && arr.length ? `Smak: ${arr.join(", ")}.` : "";
}

const cardDefinitions = [
  // ── CHAMPAGNE & MOUSSERANDE ─────────────────────────────────────────
  {
    id: "c1",
    categoryId: "6",
    question: "French Bloom, French Sparkling Blanc",
    answer: `Frankrike. Alkoholfri mousserande. ${flavors(["äpple", "päron", "citrus", "blommig"])} ${price(99, 550)}`,
  },
  {
    id: "c2",
    categoryId: "6",
    question: "Mont-Ferrant, Americano Brut Nature",
    answer: `Spanien, Välbalanserad och frisk med inslag av grapefrukt och röda äpplen, med torrt avslut. ${grapes(["Chardonnay 25%", "Macabeo 25%", "Parellada 25", "Xarel-lo 25%"])}${flavors(["citrus", "grönt äpple", "mineraler", "bröd"])} ${price(135, 810)}`,
  },
  {
    id: "c3",
    categoryId: "6",
    question: "Maison Pierre Chainier, Crémant Brut",
    answer: `Frankrike, Loire. Crémant. Torr med tilltalande, rena fruktsyror, fräsch smak med inslag av gula äpplen, persika, päron. ${grapes(["Chardonnay 80%", "Chenin blanc 20%"])}${flavors(["äpple", "päron", "blommig", "lätt krydda"])} Passar Till
    Perfekt all-roundvin! Till skaldjur, kallskuret, ostbrickan och till olika fruktdesserter. Och som aperitif eller drink! ${price(160, 950)}`,
  },
  {
    id: "c4",
    categoryId: "6",
    question: "NV Moët & Chandon, Impérial Brut",
    answer: `Frankrike, Champagne. Klassisk NV. Frisk och fruktig. Champagnen har lagrats i minst tre år, vilket ger den dess typiska smak av aprikos, mandelblom, brioche, småkakor och vanilj. ${grapes(["Pinot Noir 30-40%", "Chardonnay 20-30%", "Pinot Meunier 40%"])}${flavors(["gult äpple", "citrus", "briosch", "blommiga nyanser"])} ${price(210, 1270)}`,
  },
  {
    id: "c5",
    categoryId: "6",
    question: "NV Moët & Chandon, Impérial Brut Magnum (1,5L)",
    answer: `Frankrike, Champagne. Magnum 1,5L. Champagnen har lagrats i minst tre år, vilket ger den dess typiska smak av aprikos, mandelblom, brioche, småkakor och vanilj. ${grapes(["Pinot Noir 30-40%", "Chardonnay 20-30%", "Pinot Meunier 40%"])}${flavors(["gult äpple", "citrus", "briosch", "blommiga nyanser"])}  ${price(null, 2500)}`,
  },
  {
    id: "c6",
    categoryId: "6",
    question: "NV Moët & Chandon, Ice Impérial",
    answer: `Frankrike, Champagne. Ice Impérial skapades specifikt för att serveras med isbitar. ${grapes(["Pinot Noir 40-50%", "Chardonnay 10-20%", "Pinot Meunier 30-40%"])}${flavors(["guava", "mango", "nektarin", "söt finish"])} ${price(null, 1250)}`,
  },
  {
    id: "c7",
    categoryId: "6",
    question: "2015 Moët & Chandon, Grand Vintage Blanc",
    answer: `Frankrike, Champagne. Grand Vintage 2015 återspeglar en skörd av exceptionellt högkvalitativa svarta druvor. De uppvisade anmärkningsvärd mognad, med en kraftfull och fruktig doft och en fyllig avslutning. ${grapes(["Pinot Noir 44%", "Chardonnay 32%", "Pinot Meunier24%"])}${flavors(["gula plommon", "rostat bröd", "honung", "lång finish"])} ${price(null, 1425)}`,
  },
  {
    id: "c8",
    categoryId: "6",
    question: "2016 Moët & Chandon, Grand Vintage Blanc",
    answer: `Frankrike, Champagne. Lugnet efter stormen, Moët & Chandon Grand Vintage 2016 uttrycker nåd och frid, harmoni född ur mästerlig vinframställning och sex års lagring i källare. ${grapes(["Pinot Noir 34%", "Chardonnay 48%", "Pinot Meunier18%"])}${flavors(["citrus", "vita blommor", "brioche", "mineraler"])} ${price(null, 1425)}`,
  },
  {
    id: "c9",
    categoryId: "6",
    question: "NV Moët & Chandon, Impérial Rosé",
    answer: `Frankrike, Champagne. Roséchampagne, elegant och fruktig, Varje flaska Champagne Brut Impérial Rosé förkroppsligar vår expertis, där tre ädla druvsorter förenas i perfekt harmoni.  ${grapes(["Pinot Noir 40-50%", "Chardonnay 10-20%", "Pinot Meunier 30-40%"])}${flavors(["vild jordgubbe, hallon, körsbär", "nyanser av ros", "lätt antydan till peppar"])} ${price(null, 1310)}`,
  },
  {
    id: "c10",
    categoryId: "6",
    question: "NV Moët & Chandon, Impérial Rosé Magnum (1,5L)",
    answer: `Frankrike, Champagne. Rosé Magnum. Elegant och fruktig, Varje flaska Champagne Brut Impérial Rosé förkroppsligar vår expertis, där tre ädla druvsorter förenas i perfekt harmoni.  ${grapes(["Pinot Noir 40-50%", "Chardonnay 10-20%", "Pinot Meunier 30-40%"])}${flavors(["vild jordgubbe, hallon, körsbär", "nyanser av ros", "lätt antydan till peppar"])} ${price(null, 2580)}`,
  },
  {
    id: "c11",
    categoryId: "6",
    question: "2013 Dom Pérignon, Blanc",
    answer: `Frankrike, Champagne. Prestige cuvée. Komplex och mineralisk. ${grapes(["Chardonnay 60%", "Pinot Noir 40%"])}${flavors(["gula äpplen", "brioche", "mineral", "vit choklad", "grapefrukt", "nötter"])} ${price(null, 5500)}`,
  },
  {
    id: "c12",
    categoryId: "6",
    question: "2015 Dom Pérignon, Blanc",
    answer: `Frankrike, Champagne. Prestige cuvée från varm årgång. Generös och rund. ${grapes(["Chardonnay 60%", "Pinot Noir 40%"])}${flavors(["gula äpplen", "brioche", "mineral", "vit choklad", "grapefrukt", "nötter"])} ${price(null, 4900)}`,
  },
  {
    id: "c13",
    categoryId: "6",
    question: "2009 Dom Pérignon, Rosé",
    answer: `Frankrike, Champagne. Sällsynt rosé prestige cuvée. Kraftfull och elegant. ${grapes(["Pinot Noir 56%", "Chardonnay 44%"])}${flavors(["jordgubbe", "hallon", "svarta vinbär", "fikon", "mineralitet", "sälta"])} ${price(null, 7595)}`,
  },
  {
    id: "c14",
    categoryId: "6",
    question: "NV Ruinart, R de Ruinart Brut",
    answer: `Frankrike, Champagne. Frisk och elegant entréchampagne. ${grapes(["Chardonnay 40%", "Pinot Noir 40%", "Pinot Meunier 20%"])}${flavors(["grönt äpple", "citrus", "kex", "mineraler"])} ${price(230, 1400)}`,
  },
  {
    id: "c15",
    categoryId: "6",
    question: "NV Ruinart, Blanc de Blancs",
    answer: `Frankrike, Champagne. 100% Chardonnay. Frisk, mineralisk och citrusdriven. ${grapes(["Chardonnay 100%"])}${flavors(["citrus", "vit blomma", "krita", "mineraler"])} ${price(null, 2100)}`,
  },
  {
    id: "c16",
    categoryId: "6",
    question: "2010 Ruinart, Dom Ruinart",
    answer: `Frankrike, Champagne. Prestige cuvée från toppårgång. Djup och utvecklad. ${grapes(["Chardonnay 100%"])}${flavors(["nötter", "honung", "rostat bröd", "torkad frukt", "lång finish"])} ${price(null, 5795)}`,
  },
  {
    id: "c17",
    categoryId: "6",
    question: "NV Veuve Clicquot, Yellow Label Brut",
    answer: `Frankrike, Champagne. Ikonisk stil. Fyllig och fruktig. ${grapes(["Pinot Noir 50%", "Chardonnay 30%", "Pinot Meunier 20%"])}${flavors(["gult äpple", "vanilj", "rostat bröd", "honung"])} ${price(null, 1270)}`,
  },
  {
    id: "c18",
    categoryId: "6",
    question: "NV Veuve Clicquot, Extra Old Brut",
    answer: `Frankrike, Champagne. Längre lagring på reservviner. Mer komplex och nötig. ${grapes(["Pinot Noir 45%", "Chardonnay 30%", "Pinot Meunier 25%"])}${flavors(["torkad frukt", "nötter", "karamell", "brioche"])} ${price(null, 1670)}`,
  },
  {
    id: "c19",
    categoryId: "6",
    question: "2015 Veuve Clicquot, Vintage Blanc",
    answer: `Frankrike, Champagne. Årgångschampagne med struktur och längd. ${grapes(["Pinot Noir 55%", "Chardonnay 30%", "Pinot Meunier 15%"])}${flavors(["äpple", "aprikos", "rostat bröd", "mineral", "lång finish"])} ${price(null, 1720)}`,
  },
  {
    id: "c20",
    categoryId: "6",
    question: "NV Krug, Grand Cuvée 171ème Édition",
    answer: `Frankrike, Champagne. Multi-årgång prestige cuvée. Extrem komplexitet och djup. ${grapes(["Pinot Noir 44%", "Chardonnay 36%", "Pinot Meunier 20%"])}${flavors(["nötter", "torkad frukt", "kaffe", "kryddor", "honung"])} ${price(null, 6400)}`,
  },
  {
    id: "c21",
    categoryId: "6",
    question: "NV Armand de Brignac, Ace of Spades Gold",
    answer: `Frankrike, Champagne. Ikonisk lyxchampagne. Rik och krämig stil. ${grapes(["Pinot Noir 40%", "Chardonnay 40%", "Pinot Meunier 20%"])}${flavors(["röda bär", "citrus", "brioche", "vanilj", "lång lyxig finish"])} ${price(null, 6695)}`,
  },

  // ── ROSÉ ───────────────────────────────────────────────────────────
  {
    id: "r1",
    categoryId: "7",
    question: "Santiago, Assinatura de Família",
    answer: `Portugal, Vinho Verde. Frisk och fruktig med en lätt sprits. Jordgubbar, hallon och röda vinbär med en behaglig sötma och läskande syra. ${grapes(["Vinhão", "Espadeiro"])}${flavors(["Jordgubbar", "hallon", "röda vinbär"])} ${price(155, 660)}`,
  },
  {
    id: "r2",
    categoryId: "7",
    question: "Château d'Esclans, Whispering Angel",
    answer: `Frankrike, Provence. Ikonisk Provence rosé. Delikat och blommig. ${grapes(["Grenache", "Cinsault", "Rolle (Vermentino)", "Syrah"])}${flavors(["jordgubbe", "persika", "smultron"])} ${price(185, 850)}`,
  },
  {
    id: "r3",
    categoryId: "7",
    question: "Château d'Esclans, Whispering Angel Magnum (1,5L)",
    answer: `Frankrike, Provence. Whispering Angel i Magnum. ${grapes(["Grenache", "Cinsault", "Rolle (Vermentino)", "Syrah"])}${flavors(["jordgubbe", "persika", "smultron"])} ${price(null, 1660)}`,
  },
  {
    id: "r4",
    categoryId: "7",
    question: "Maison Galoupet, Provence",
    answer: `Frankrike, Provence. Elegant rosé med . ${grapes(["Syrah", "Grenache", "Cinsault", "Sémillon", "Rolle cirka 2-4%"])}${flavors(["röda bär", "kryddor", "örter", "mineralisk"])} ${price(175, 800)}`,
  },
  {
    id: "r5",
    categoryId: "7",
    question: "NV Château Galoupet, Cru Classé",
    answer: `Frankrike, Provence. Cru Classé — toppen av Provence-klassificeringen. ${grapes(["Syrah", "Grenache", "Cinsault", "Sémillon", "Rolle cirka 2-4%"])}${flavors(["röda bär", "citrus", "mineraler", "lång finish"])} ${price(null, 1875)}`,
  },
  {
    id: "r6",
    categoryId: "7",
    question: "2021 Château d'Esclans, Rock Angel",
    answer: `Frankrike, Provence. Mer komplex och strukturerad än Whispering Angel, görs på vin från äldre vinstockar. ${grapes(["Grenache 80-85%", "Rolle (Vermentino)", "Cinsault"])}${flavors(["persika", "aprikos", "röda bär", "mineralisk"])} ${price(null, 1150)}`,
  },
  {
    id: "r7",
    categoryId: "7",
    question: "2021 Château d'Esclans, Les Clans",
    answer: `Frankrike, Provence. Premium rosé, till skillnad från de enklare vinerna är Les Clans helt jäst och lagrat på 600-liters franska ekfat under 10 månader.  ${grapes(["Rolle (Vermentino)", "Grenache"])}${flavors(["röda bär", "brioche", "vanilj", "komplex"])} ${price(null, 2300)}`,
  },
  {
    id: "r8",
    categoryId: "7",
    question: "2021 Château d'Esclans, Garrus",
    answer: `Frankrike, Provence. Flaggskeppsrosé. Ekfatslagrat, extremt komplex. ${grapes(["Grenache större del", " Rolle (Vermentino)"])}${flavors(["persika", "mango", "vanilj", "rostad ek", "komplex"])} ${price(null, 3950)}`,
  },

  // ── VITT ───────────────────────────────────────────────────────────
  {
    id: "v1",
    categoryId: "8",
    question: "Kuentz-Bas, Pinot Gris & Gewürztraminer",
    answer: `Frankrike, Alsace. Aromatisk och lite blommig. Passar till asiatisk mat. ${grapes(["Silvaner 30%", "Pinot Blanc 30% ", "Riesling 20%", "Muscat 10%", "Pinot Gris 5%", "Gewürztraminer 5%"])}${flavors(["rosenblad", "ingefära", "tropisk frukt"])} 
     Passar som aperitif eller till lättare rätter som sallad, fisk eller skaldjur. ${price(170, 850)}`,
  },
  {
    id: "v2",
    categoryId: "8",
    question: "2024 TGC, Ménage à Loire Saumur",
    answer: `Frankrike, Loire. Frisk Chenin Blanc från Saumur. ${grapes(["Chenin Blanc"])}${flavors(["honung", "kvitten", "citrus", "mineralisk"])} Som matchar en krämig sparrissoppa, klassisk räkmacka samt fisk och skaldjursrätter. ${price(null, 735)}`,
  },
  {
    id: "v3",
    categoryId: "8",
    question: "Domaine La Croix St-Laurent, Sancerre",
    answer: `Frankrike, Loire/Sancerre. Klassisk Sancerre. Mineralisk, örtig och frisk. ${grapes(["Sauvignon Blanc"])}${flavors(["grapefrukt", "örter", "krusbär", "mineralisk"])} Passar ostron och alla fräscha skaldjur, sparris, kall hummer, vinbräserad kalv eller gräddkokt kalkon. Och så klart till en ostbricka
     ${price(195, 890)}`,
  },
  {
    id: "v4",
    categoryId: "8",
    question: "2022 Charly Nicolle, 1er Cru Mont de Milieu",
    answer: `Frankrike, Chablis Premier Cru. Ett torrt och friskt vin med en fyllig textur, med inslag av honung, gula äpplen och som avslutas med uppfriskande kalkstensmineralitet. ${grapes(["Chardonnay"])}${flavors(["mogna citrusfrukter", "mineralisk", "gula äpplen"])} Passar Till
    Perfekt kompanjon till fisk och skaldjursrätter ${price(null, 1450)}`,
  },
  {
    id: "v5",
    categoryId: "8",
    question: "2022 Charly Nicolle, 1er Cru Fourneaux Ante MCMLXXX",
    answer: `Frankrike, Chablis Premier Cru. Med karaktär. ${grapes(["Chardonnay"])}${flavors(["mogna citrusfrukter", "mineralisk", "ren och frisk"])} Gott som aperitif samt till alla rätter av fisk och skaldjur. ${price(null, 1400)}`,
  },
  {
    id: "v6",
    categoryId: "8",
    question: "Domaine Louis Moreau, Bieville",
    answer: `Frankrike, Chablis. Frisk och mineralisk. Vinet är torrt och friskt med en elegant syra. Vinet har inslag av mineral, citrus och avslutas med en lång finish. ${grapes(["Chardonnay"])}${flavors(["citrus", "grönt äpple", "frisk"])} Serveras gärna till skaldjur, lättare fiskrätter men gör sig även bra på egen hand. ${price(205, 920)}`,
  },
  {
    id: "v7",
    categoryId: "8",
    question: "2022 Domaine Louis Moreau, 1er Cru Les Fourneaux",
    answer: `Frankrike, Chablis Premier Cru. Rund och varm smak av gula äpplen, solmogna citroner och vit persika. ${grapes(["Chardonnay"])}${flavors(["citrus", "äpple", "mineralisk"])} Utmärkt med lättkryddade rätter och ljust kött i krämig sås såsom Bjärökyckling med moreller eller pilgrimsmusslor i saffransås. ${price(null, 1200)}`,
  },
  {
    id: "v8",
    categoryId: "8",
    question: "2021 Domaine Louis Moreau, Grand Cru Valmur",
    answer: `Frankrike, Chablis Grand Cru. Toppen av Chablis-pyramiden. Ett kraftfullt vin full av energi bakom den eleganta och soliga fasaden. ${grapes(["Chardonnay"])}${flavors(["citrus", "flinta", "vit blomma", "komplex mineralisk"])}
    Utmärkt till fläsk, kalvracks eller fågel med smakrik svampsås, smörstekt piggvar med brynt smör samt till kraftiga fisk- och skaldjursrätter. ${price(null, 2600)}`,
  },
  {
    id: "v9",
    categoryId: "8",
    question: "2022 Maison Champy, Cuvée Edme",
    answer: `Frankrike, Bourgogne Blanc. Medelfyllig och frisk, med rik, fyllig, fint avrundad smak. ${grapes(["Chardonnay"])}${flavors(["smör", "äpple", "vanilj", "lätt ek"])} Mycket bra kombination med piggvar, grillade kalvkotletter eller pärlhöna i sällskap med skogssvamp, den sena sommarens grönsaker som röd paprika, majs, pumpa och butternutpumpa till lax.  ${price(null, 1050)}`,
  },
  {
    id: "v10",
    categoryId: "8",
    question: "2021 Maison Champy, Pernand-Vergelesses",
    answer: `Frankrike, Bourgogne. Village vin. Smaken är ren, frisk och torr med en fokuserad och samtidigt krämig struktur. ${grapes(["Chardonnay"])}${flavors(["nötter", "smör", "rostat bröd", "mineralisk"])} Smakrika fisk- och skaldjursrätter, gärna med saffran och citron. ${price(null, 1710)}`,
  },
  {
    id: "v11",
    categoryId: "8",
    question: "2023 Henri de Villamont, Mâcon-Village",
    answer: `Frankrike, Bourgogne/Mâcon. Medelfylligt och elegant med lager på lager av rika, krämiga och friska aromer av lemon curd ${grapes(["Chardonnay"])}${flavors(["äpple", "citrus", "blommig", "frisk"])}
    Torskrygg med skirat smör och färskriven pepparrot, skaldjur, moules à la crème, halstrad röding i vitvinssås, gratinerad hummer${price(null, 850)}`,
  },
  {
    id: "v12",
    categoryId: "8",
    question:
      "2022 Henri de Villamont, Chassagne-Montrachet 1er Cru Les Embazées",
    answer: `Frankrike, Bourgogne Premier Cru. Torrt, fylligt vin. Elegant med vibrerande friskhet, vit persika och den avrundande smörigheten mot mineraltonen. ${grapes(["Chardonnay"])}${flavors(["smör", "hasselnöt", "citrus", "mineralisk", "komplex"])} Skaldjur som pilgrimsmusslor, hummer och langoustine, sole meunière, grillad havsabborre eller piggvar, kyckling eller fasan i gräddsås. ${price(null, 2950)}`,
  },
  {
    id: "v13",
    categoryId: "8",
    question: "S.A Prüm, Solitär Trocken, Riesling",
    answer: `Tyskland, Mosel. Torr Riesling, frisk och saftig smak med inslag av lime, mineral, smultron och vita persikor med pigga syror. ${grapes(["Riesling"])}${flavors(["lime", "persikor", "mineraler", "citrus", "aprikoser"])} Läckert på egen hand som aperitif eller sällskapsdrink med lätt småplock, lätta skaldjurs- och fiskrätter, somriga sallader och till mildare kryddade rätter ur det asiatiska köket. ${price(180, 830)}`,
  },
  {
    id: "v14",
    categoryId: "8",
    question: "2017 S.A Prüm, Bernkasteler Lay GG",
    answer: `Tyskland, Mosel. Grosses Gewächs — topp tysk klassificering.
    Medelfyllig, torr, komplex, varm smak med toner av aprikoser, melon och citrus. ${grapes(["Riesling"])}${flavors(["honung", "persika", "mineraler", "petroleum", "komplex"])} Grillad tonfisk eller grillad röding, rätter av ljust kött som kalvschnitzel, örtkryddad fläskstek och lättare vilt med trattkantareller. ${price(null, 1350)}`,
  },
  {
    id: "v15",
    categoryId: "8",
    question: "2023 Soellner, Von Gösing, Riesling",
    answer: `Torrt vin med en elegant fruktton av citrus och tropisk frukt med bra balans. ${grapes(["Riesling"])}${flavors(["citrus", "persika", "peppar"])} Sushi och till lättare fisk- och skaldjursrätter. ${price(null, 950)}`,
  },
  {
    id: "v16",
    categoryId: "8",
    question: "2024 Soellner, Ried Hengstberg, Grüner Veltliner",
    answer: `Österrike, Wagram. Torrt och aromatiskt med rik fruktton och underbar balans mellan frukt och syra. Lång eftersmak med typisk druvkaraktär. ${grapes(["Grüner Veltliner"])}${flavors(["citronzest", "päron", "grapefrukt"])} Passar till ceviche, löjromstoast, pocherad fisk, skaldjur naturell. ${price(null, 850)}`,
  },
  {
    id: "v17",
    categoryId: "8",
    question: "Piccini, Patriale Bianco Eko",
    answer: `Italien, multi-region eko. 50% Viognier (Sicilien) · 20% Chardonnay (Trentino) · 20% Vermentino (Maremma, Toscana) · 10% Pecorino (Marche).${flavors(["persika", "aprikos", "blommig", "tropisk"])} Lättare fisk & skaldjur,räksallad, ugnsbakad lax, moules frites eller stekt vit fisk med citron  ${price(150, 660)}`,
  },
  {
    id: "v18",
    categoryId: "8",
    question: "Burgáns, Albariño",
    answer: `Spanien, Rias Baixas. Frisk och mineralisk. Perfekt till fisk och skaldjur. ${grapes(["Albariño"])}${flavors(["citrus", "persika", "mineraler", "gröna äpplen"])} ${price(null, 790)}`,
  },
  {
    id: "v19",
    categoryId: "8",
    question: "2023 José Pariente, Fermentado en Barrica, Verdejo",
    answer: `Spanien, Rueda. Ekfatsfermenterad Verdejo. Mer kropp, läcker mjuk och intensiv smak! Perfekt till grillade fisk-och skaldjur. ${grapes(["Verdejo"])}${flavors(["grönt äpple", "örter", "citrus", "lätt ek"])}  Perfekt till grillade fisk-och skaldjur.${price(null, 930)}`,
  },
  {
    id: "v20",
    categoryId: "8",
    question: "2023 Terrazas de los Andes, Chardonnay",
    answer: `Argentina, Mendoza. Fruktig och frisk från höghöjdsläge. ${grapes(["Chardonnay"])}${flavors(["tropisk frukt", "citrus", "vanilj", "frisk"])} Fisk och skaldjur eller till en krämig pasta. Ett perfekt val för den som vill upptäcka nya spännande viner från Sydamerika. ${price(180, 865)}`,
  },
  {
    id: "v21",
    categoryId: "8",
    question: "2022 Clos du Bois, Chardonnay",
    answer: `USA, Kalifornien. Californisk Chardonnay med tropisk frukt. ${grapes(["Chardonnay"])}${flavors(["smör", "tropisk frukt", "vit persika", "päron", "ek"])} Passar utmärkt till grillad kyckling, ugnsbakad lax eller skaldjursrätter som hummer och räkor i smörsås. ${price(null, 720)}`,
  },
  {
    id: "v22",
    categoryId: "8",
    question: "2023 Talbott, Kali Hart, Chardonnay",
    answer: `USA, Kalifornien/Monterey. Elegant Chardonnay. ${grapes(["Chardonnay"])}${flavors(["äpple", "citrus", "lätt ek", "elegant"])}    Grillad fisk med gräddiga såser, majskyckling med tryffel eller skogssvamp ${price(null, 1050)}`,
  },
  {
    id: "v23",
    categoryId: "8",
    question: "2023 Rombauer, Carneros, Chardonnay",
    answer: `USA, Kalifornien. Ikonisk Californisk Chardonnay. Smörig och fyllig. ${grapes(["Chardonnay"])}${flavors(["smör", "ananas", "vanilj", "ek", "fyllig"])} Detta är en kraftfull Chardonnay som skulle vara en utmärkt matchning till kyckling i en krämig sås, hårdost eller stekta pilgrimsmusslor och skaldjur.
 ${price(null, 1750)}`,
  },

  // ── RÖTT ───────────────────────────────────────────────────────────
  {
    id: "ro1",
    categoryId: "9",
    question: "2018 Château Patache d'Aux",
    answer: `Frankrike, Bordeaux. Klassisk blandning. Strukturerat och lagringsbart. Tanninerna är mogna och väl integrerade. Fina fruktsyror i avslutningen. ${grapes(["Cabernet Sauvignon 60%", "Merlot 30%", "Cabernet Franc 7%", "Petit Verdot 3%"])}${flavors(["svarta vinbär", "lakrits", "björnbär", "tanninrik"])} Passar bäst till entrecoté ${price(null, 950)}`,
  },
  {
    id: "ro2",
    categoryId: "9",
    question: "2019 Château Capet-Guillier, Saint Emilion Grand Cru",
    answer: `Frankrike, Bordeaux/Saint Emilion Grand Cru. Fylligt, mjukt, elegant och komplext, ett lysande exempel på ett Saint-Emilion ${grapes(["Merlot"])}${flavors(["mogna bär,", "läder", "kaffe", "kryddor"])} En klassiker till kalventrecôte med murklor eller Karl Johansvamp. Till kantarelltoast, T-bonesteak ${price(null, 1820)}`,
  },
  {
    id: "ro3",
    categoryId: "9",
    question: "2022 Maison Champy, Chorey Les Beaune, Pinot Noir",
    answer: `Frankrike, Bourgogne. Elegant. Körsbär och jordiga toner. ${grapes(["Pinot Noir"])}${flavors(["körsbär", "hallon", "rostade ekfat"])} ${price(null, 1950)}`,
  },
  {
    id: "ro4",
    categoryId: "9",
    question: "2022 Maison Champy, Pommard, Pinot Noir",
    answer: `Frankrike, Bourgogne/Pommard. Kraftigare och mer tanninrik Bourgogne. ${grapes(["Pinot Noir"])}${flavors(["körsbär", "jord", "lädrig", "tanninrik"])} ${price(null, 2800)}`,
  },
  {
    id: "ro5",
    categoryId: "9",
    question: "Henri de Villamont, Prestige, Pinot Noir",
    answer: `Frankrike, Bourgogne. Tillgänglig och elegant, balanserad, bärig smak med inslag av jordgubbar, hallon, lingon, kanel samt en lätt känsla av fat. ${grapes(["Pinot Noir"])}${flavors(["jordgubbar", "hallon", "ek fat", "elegant"])} ${price(190, 950)}`,
  },
  {
    id: "ro6",
    categoryId: "9",
    question: "2019 Henri de Villamont, Santenay La Plice, Pinot Noir",
    answer: `Frankrike, Bourgogne/Santenay. Fruktigt, balanserad, smakrik, silkeslen, rund och frisk med inslag kryddor som peppar, kanel, mynta. ${grapes(["Pinot Noir"])}${flavors(["hallon", "jordgubbe", "vinbär", "viol", "lakrits"])} ${price(null, 1290)}`,
  },
  {
    id: "ro7",
    categoryId: "9",
    question: "2019 Henri de Villamont, Savigny-Lès-Beaune, Pinot Noir",
    answer: `Frankrike, Bourgogne/Savigny. Körsbär och lite krydda, fruktig med en delikat animalisk ton och återkommande inslag av röda bär. ${grapes(["Pinot Noir"])}${flavors(["körsbär", "hallon", "frisk"])} ${price(null, 1220)}`,
  },
  {
    id: "ro8",
    categoryId: "9",
    question: "Ogier, Côtes du Rhône",
    answer: `Frankrike, Rhône. GSM-blandning. Rund och kryddig. ${grapes(["Grenache 60%", "Syrah 35%", "Mourvèdre 5%"])}${flavors(["björnbär", "katrinplommon", "örter", "rund"])} Bra all-roundvin för rätter från olika länder ${price(160, 750)}`,
  },
  {
    id: "ro9",
    categoryId: "9",
    question: "2023 Ogier, Gigondas Les Dentelles",
    answer: `Frankrike, Rhône/Gigondas. Fylligt, smakrikt, saftigt men elegant, med bra balans i tanniner, fruktsyror ${grapes(["Grenache 70%", "Syrah 20%", "Mourvèdre 10%"])}${flavors(["fikon", "blåbär", "björnbär", "vanilj "])} ${price(null, 990)}`,
  },
  {
    id: "ro10",
    categoryId: "9",
    question: "2023 Ogier, L'ame Chateauneuf-du-Pape",
    answer: `Frankrike, Rhône/Chateauneuf-du-Pape. En av Frankrikes mest ikoniska appellationer. ${grapes(["Grenache 70%", "Syrah 25%", "Mourvèdre 5%"])}${flavors(["mörka körsbär", "svarta vinbär", "kryddor", "läder", "lång finish"])} ${price(null, 1300)}`,
  },
  {
    id: "ro11",
    categoryId: "9",
    question: "Piccini, Patriale, Primitivo & Montepulciano",
    answer: `Italien, Toscana. Fruktig och mjuk. Bra glasvin, smakrik och fruktig smak med pigg frukt och finstämd fruktsyra. ${grapes(["Primitivo 40%", "Montepulciano 30%", "Nero davola 20%", "Merlot del Veneto 10% "])}${flavors(["plommon", "körsbär", "mjuk tannin", "fruktig"])} ${price(150, 660)}`,
  },
  {
    id: "ro12",
    categoryId: "9",
    question: "Roberto Sarotto, Langhe Nebbiolo",
    answer: `Italien, Piemonte. Fin försmak på Barolo-stilen i generös och direkt stil! ${grapes(["Nebbiolo"])}${flavors(["körsbär", "lakrits", "tjära", "tobak", "subtil ekfatston"])} ${price(195, 860)}`,
  },
  {
    id: "ro13",
    categoryId: "9",
    question: "2024 Mauro Sebaste, Barbera d'Alba Contessa Rosalia",
    answer: `Italien, Piemonte. Fruktig och saftig. Hög syra och mjuka tanniner. ${grapes(["Barbera"])}${flavors(["körsbär", "nypon", "nougat", "mjuk tannin", "jordgubbar"])} ${price(null, 790)}`,
  },
  {
    id: "ro14",
    categoryId: "9",
    question: "2022 Castello di Neive, Barbaresco",
    answer: `Italien, Piemonte/Barbaresco. Nebbiolos mjukare sida. ${grapes(["Nebbiolo"])}${flavors(["röda", "tjära", "mörka bär", "nypon", "elegant"])} ${price(null, 2000)}`,
  },
  {
    id: "ro15",
    categoryId: "9",
    question: "2019 Casa E di Mirafiore, Barolo Classico",
    answer: `Italien, Piemonte/Barolo. Vinernas kung. Kraftfullt, mycket komplex smak med integrerad tanninstruktur  — dekanteras. ${grapes(["Nebbiolo"])}${flavors(["rosor", "tjära", "mogna körsbär", "läder", "kraftig tannin"])} ${price(null, 2200)}`,
  },
  {
    id: "ro16",
    categoryId: "9",
    question: "2019 Pasqua, Famiglia Valpolicella Ripasso",
    answer: `Italien, Veneto. Ripasso-metod ger extra kropp och frukt, bra fruktsyra som balanseras upp av mogna frukttoner av mogna jordgubbar och körsbär.${grapes(["Corvina", "Corvinone", "Rondinella"])}${flavors(["mörka bär", "vaniljton", "lakritsrot", "fyllig"])} Klassisk Ripasso som passar till charkuterier, grillat kött  ${price(null, 850)}`,
  },
  {
    id: "ro17",
    categoryId: "9",
    question: "2022 Torre Mora, Scalunera Etna Rosso",
    answer: `Italien, Sicilien/Etna. Vulkanisk. Ung, elegant och saftig smak med mycket friska syra, pigga tanniner och fin balans mellan röd frukt och ekfat. ${grapes(["Nerello Mascalese 97%", "Nerello Cappuccio 3%"])}${flavors(["körsbär", "mineraler", "örter", , " ekfat", "vulkanisk"])} ${price(null, 780)}`,
  },
  {
    id: "ro18",
    categoryId: "9",
    question: "2022 Bousquet, Gaia, Cabernet Sauvignon",
    answer: `Argentina, Mendoza. Ekologisk Cabernet. Svarta vinbär och mörk choklad. ${grapes(["Cabernet Sauvignon"])}${flavors(["svarta vinbär", "mörka körsbär", "grillad röd paprika", "choklad"])} Ett säkert kort till entrecôte med bearnaisesås ${price(170, 800)}`,
  },
  {
    id: "ro19",
    categoryId: "9",
    question: "2022 Terrazas de los Andes, Malbec",
    answer: `Argentina, Mendoza. Klassisk Malbec. Mjuk och fyllig, odlas på 1100 meter höjd ${grapes(["Malbec"])}${flavors(["plommon", "violer", "choklad", "mjuk tannin"])} ${price(170, 765)}`,
  },
  {
    id: "ro20",
    categoryId: "9",
    question: "2022 J Vineyards, Pinot Noir",
    answer: `USA, Kalifornien. Fruktdrivet och silkigt, smaken är rödbärig och medelfyllig med silkesmjuka tanniner ${grapes(["Pinot Noir"])}${flavors(["jordgubbe", "körsbär", "torkade tranbär", "nejlika", "viss ekkaraktär"])} ${price(null, 900)}`,
  },
  {
    id: "ro21",
    categoryId: "9",
    question: "2021 Macmurray, Russian River, Pinot Noir",
    answer: `USA, Kalifornien/Russian River Valley. Elegans och djup, fyllig, varm och elegant med tydlig druvkaraktär.  ${grapes(["Pinot Noir"])}${flavors(["mogna körsbär", "Viss ekkaraktär", "hallon", "elegant"])} ${price(null, 1100)}`,
  },
  {
    id: "ro22",
    categoryId: "9",
    question: "2021 Louis M Martini, Sonoma County, Cabernet Sauvignon",
    answer: `USA, Kalifornien/Sonoma. Kraftig och strukturerad, smakrikt och har en generös, varm fruktton av björnbär och mogna körsbär. ${grapes(["Cabernet Sauvignon"])}${flavors(["svarta vinbär", "tobak", "ceder", "björnbär", "mogna körsbär"])} ${price(null, 1150)}`,
  },
  {
    id: "ro23",
    categoryId: "9",
    question: "2021 Rombauer, Merlot",
    answer: `USA, Kalifornien. Mjuk och lyxig merlot från Napa Valley. ${grapes(["Merlot 89%,", "Cabernet Sauvignon 9%", "Petit Verdot 2%"])}${flavors(["plommon", "cassis", "svarta körsbär", "ceder och tobaksblad"])} ${price(null, 2250)}`,
  },

  // ── SÖTT & DESSERT ─────────────────────────────────────────────────
  {
    id: "s1",
    categoryId: "10",
    question: "2018 Château Rieussec, Carmes de Rieussec Sauternes",
    answer: `Frankrike, Bordeaux/Sauternes. Klassiskt sött vin. ${grapes(["Sémillon", "Sauvignon Blanc"])}${flavors(["honung", "aprikos", "ingefära", "saffran"])} ${price(125, null)}`,
  },
  {
    id: "s2",
    categoryId: "10",
    question: "2021 Roberto Sarotto, Pajass Passito, Moscato Bianco",
    answer: `Italien, Piemonte. Passito-stil. Koncentrerat och blommigt med torkad frukt. ${grapes(["Moscato Bianco"])}${flavors(["torkad aprikos", "honung", "mandel", "blommig"])} ${price(135, null)}`,
  },
  {
    id: "s3",
    categoryId: "10",
    question: "2024 Mauro Sebaste, Moscato d'Asti",
    answer: `Italien, Piemonte. Lätt mousserande och sött. ${grapes(["Moscato Bianco"])}${flavors(["persika", "apelsinblom", "honung", "lätt mousse"])} ${price(105, null)}`,
  },
  {
    id: "s4",
    categoryId: "10",
    question: "10y Quinta do Vallado, Tawny Port",
    answer: `Portugal, Douro. 10 år Tawny Port. Nötter, torkad frukt och karamell. ${grapes(["Touriga Nacional", "Tinta Roriz", "Tinta Barroca", "Touriga Franca"])}${flavors(["nötter", "torkad frukt", "karamell", "apelsinskal"])} ${price(150, null)}`,
  },

  // ── ÖL ─────────────────────────────────────────────────────────────
  {
    id: "b1",
    categoryId: "3",
    question: "Heineken",
    answer:
      "Holland. Klassisk lager, 5.0%. Smak: malt, humle, frisk, lätt bitter.",
  },
  {
    id: "b2",
    categoryId: "3",
    question: "Mariestads Ljusa Brygd",
    answer:
      "Sverige. Svensk premium lager, 4.7%. Smak: malt, humle, blommig, frisk.",
  },
  {
    id: "b3",
    categoryId: "3",
    question: "Omaka Suntrip Session IPA",
    answer:
      "Sverige. Session IPA, fruktig och humlig, 4.5%. Smak: citrus, tropisk humle, frisk, lätt bitter.",
  },
  {
    id: "b4",
    categoryId: "3",
    question: "Sleepy Bulldog Pale Ale",
    answer:
      "Sverige. Pale Ale med fin bitterhet, 4.8%. Smak: citrus, humle, blommig, frisk bitter.",
  },
  {
    id: "b5",
    categoryId: "3",
    question: "Melleruds Utmärkta Pilsner Eko",
    answer: "Sverige. Ekologisk pilsner, 4.5%. Smak: malt, humle, frisk, lätt.",
  },
  {
    id: "b6",
    categoryId: "3",
    question: "Daura Damm Glutenfri Lager",
    answer:
      "Spanien. Glutenfri lager, 5.4%. Smak: malt, humle, frisk, neutral.",
  },
  {
    id: "b7",
    categoryId: "3",
    question: "Omaka Ofarlig IPA",
    answer:
      "Sverige. IPA med karaktär, 5.4%. Smak: citrus, tropisk humle, bitter, aromatisk.",
  },

  // ── COCKTAILS ──────────────────────────────────────────────────────
  {
    id: "401",
    categoryId: "4",
    question: "Vad innehåller en Negroni?",
    answer:
      "Lika delar gin, Campari och söt vermouth. Garneras med apelsinskal.",
  },
  {
    id: "402",
    categoryId: "4",
    question: "Vad är skillnaden mellan shaken och stirred?",
    answer:
      "Shaken: luftig, kallare, lätt grumlig. Stirred: silkig, klar. Regel: cocktails med juice/ägg shakas, rena spritdrinkar rörs.",
  },
  {
    id: "403",
    categoryId: "4",
    question: "Vad innehåller en Spicy Margarita?",
    answer:
      "Tequila i chili crisp oli, triple sec, lime, gurka, socker, tajin kant.",
  },
  {
    id: "406",
    categoryId: "4",
    question: "Vad innehåller en Nordic GT?",
    answer: "Havsbris gin, rårörda lingon, rosmarin & tonic perfect served.",
  },
  {
    id: "407",
    categoryId: "4",
    question: "Vad innehåller en Kaffe Klara?",
    answer: "Dubbel espresso, Baileys och triple sec.",
  },

  // ── SPRIT ──────────────────────────────────────────────────────────
  {
    id: "501",
    categoryId: "5",
    question: "Vad är skillnaden mellan bourbon och whisky?",
    answer:
      "Bourbon är amerikansk whisky gjord på minst 51% majs, lagrad i nya utbrända ekfat. Scotch whisky är skotsk och lagrad minst 3 år.",
  },
  {
    id: "502",
    categoryId: "5",
    question: "Vad är gin destillerat på?",
    answer:
      "Neutral sprit smaksatt med enbär (juniper berries) och botanicals som koriander, angelikarot m.m.",
  },
  {
    id: "503",
    categoryId: "5",
    question: "Vad är Brugal?",
    answer:
      "Dominikansk rom från familjen Brugal, grundad 1888. Känd för sin mjuka, torrare stil jämfört med karibisk rom.",
  },
  {
    id: "504",
    categoryId: "5",
    question: "Vad är Galliano?",
    answer:
      "Italiensk örtslikör med smak av vanilj, anis och örter. Används bl.a. i Harvey Wallbanger.",
  },
  {
    id: "505",
    categoryId: "5",
    question: "Vad är Dry Curaçao?",
    answer:
      "Apelsinlikör från ön Curaçao, torrare variant utan tillsatt socker. Används i Margarita och Cosmopolitan.",
  },
];

export const initialCards = syncCardsWithInventory(cardDefinitions);
