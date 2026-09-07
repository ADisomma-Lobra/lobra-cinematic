# Lobra — Concept cinematico (terza versione)

Terza direzione, costruita da zero in un progetto separato: non tocca
`LobraWebsite/` né `LobraWebsite-Dynamic/`. Una pagina unica, un solo
scroll continuo — hero, tuffo del pesce, tecnologie, rivelazione a
cerchio, frase in dissolvenza, chi siamo, settori con sfondo che cambia,
numeri, storie, FAQ, contatti — modellata sui 13 screenshot di
riferimento in `../website/`, riscritta nella palette e nel linguaggio
di Lobra (whitesmoke, nero, crimson, il pesce, le correnti marine).

## Come vederla

Stessa regola delle altre due versioni: niente doppio click su
`index.html` (i testi arrivano via `fetch()`, bloccato su `file://`).

```
doppio click su start-preview.bat
```

Si apre `http://localhost:5500` (o la porta libera più vicina).

## Come i 13 screenshot diventano il sito

| # | Riferimento | Nella pagina |
|---|---|---|
| 1 | Hero, loghi in alto, claim | **Hero**: onde animate in basso, il pesce "affacciato" a metà, in attesa dello scroll |
| 2–4 | Loghi che si raggruppano → cerchio che si apre su un video → schermo intero | **Il tuffo**: il pesce esce, si tuffa, la scena scorre verso **Tecnologie** (bolle con i loghi partner attorno al segno del pesce) e poi un **cerchio che si apre** su un pannello a piena pagina |
| 5 | Frase in dissolvenza sul video | **Frase scorrevole**: "Non vendiamo software. Diamo una direzione." si illumina parola per parola mentre scorri, sopra lo stesso pannello |
| 6 | Sezione "Trust" chiara con badge e illustrazione tecnica | **Chi siamo**: badge onesti (2016, 3 aziende, Italia+Irlanda) e un'illustrazione schematica invece della foto che non abbiamo |
| 7–9 | Elenco settori con sfondo fotografico che cambia | **Settori**: la riga attiva cambia scorrendo, e lo sfondo passa da una tinta astratta all'altra per ogni settore — stessa logica dei loghi, senza foto stock |
| 10 | Numeri che salgono velocemente | **In cifre**: 150+ Lobrers, 5+1 sedi, 300+ progetti, animati al primo sguardo |
| 11 | Citazioni clienti | **Storie**: tre testimonianze — **inventate**, segnalate in pagina, stesso principio già usato nella seconda versione |
| 12 | FAQ semplice | **FAQ**: accordion, cinque domande reali su Lobra |
| 13 | CTA finale + footer | **Contatti**: stessa banda crimson e footer delle altre due versioni |

## Cosa è stato semplificato rispetto al riferimento

Il sito originale usa un'unica barra di avanzamento/video che accompagna
tutta la sezione centrale (loghi → video → frase → settori) come se fosse
un solo player. L'ho scomposta in **due passaggi in sequenza** (bolle →
cerchio che si apre; poi frase in dissolvenza) invece di un'unica
animazione lunghissima: il risultato visivo è lo stesso — lo sfondo non
cambia mai bruscamente, la lettura resta continua — ma l'ingegnerizzazione
è più solida e più facile da mantenere. Se vuoi che sia un'unica sequenza
ininterrotta te lo ricostruisco, ma consiglio di valutare prima questa
versione: il "cucito" tra i due passaggi è pensato per essere invisibile.

## Le foto non ci sono ancora

Ogni punto che nel riferimento è una foto o un video vero (il team al
lavoro, gli sfondi dei settori) è qui un pannello astratto nella palette
del brand, con un'etichetta "Bozza — foto reale da inserire" ben visibile
nel pannello centrale. Quando avrete le foto vere, si sostituiscono senza
toccare il resto: il codice è già pronto a riceverle.

## Le success stories sono inventate

Come nella seconda versione: tre testimonianze con aziende, nomi e
citazioni fittizie, per farti valutare come rende la sezione. Il sito lo
dichiara in pagina. Vanno sostituite con citazioni vere e approvate prima
della pubblicazione.

## Mobile e "riduci animazioni"

Ogni passaggio pinnato (il tuffo, il cerchio che si apre, la frase in
dissolvenza, i settori) è una animazione **aggiuntiva**, non l'unico modo
di leggere il contenuto: sotto i 900px di larghezza, o se il sistema
operativo del visitatore ha "riduci animazioni" attivo, tutte le sezioni
tornano a un scroll normale, impilate una sopra l'altra, con lo stesso
contenuto, senza bloccare lo scroll né lasciare stati a metà. È lo stesso
principio già usato nella seconda versione per la sezione a scorrimento
orizzontale dei servizi.

## Verifica fatta

Ho aperto il sito con un browser vero (Playwright), non solo scritto il
codice alla cieca: 26 fermate in sequenza lungo tutto lo scroll desktop e
14 su mobile, controllando ogni passaggio — inclusi i punti dove ho
trovato e corretto due bug reali (i loghi partner comparivano in bianco e
nero invece che a colori; il pesciolino nell'hero, su schermi stretti,
copriva parte del paragrafo). Nessun errore in console, nessuno scroll
orizzontale indesiderato, verificato in italiano e in inglese.

## Secondo giro: il mare, il tuffo, il pesce

- **Le onde erano un blocco disallineato**, non centrato sulla pagina.
  Causa reale: il disegno SVG delle onde era più largo del suo stesso
  `viewBox` dichiarato, quindi metà del disegno veniva ritagliata via —
  a seconda dello scroll si vedeva un blocco pieno, non due onde intere.
  Rifatte da zero, molto più minimal come chiedevi: tre linee sottili a
  piena larghezza, tecnica diversa (un tassello CSS ripetuto invece di
  un SVG allungato), che non può più avere quel problema di misura.
- **Tolta la sezione intermedia "vuota"**: prima il tuffo del pesce
  viveva in una sezione a parte, bloccata (pinned) per un tratto di
  scroll, che appariva come un momento sospeso tra hero e tecnologie.
  Ora non esiste più: il pesce si tuffa mentre la hero stessa scorre via
  in modo naturale, e la sezione Tecnologie segue subito dopo — un solo
  scroll continuo, senza tappe intermedie.
- **Il pesce ora guarda a sinistra**, specchiato in orizzontale, sia
  nella hero che nel segno al centro delle tecnologie.

## Terzo giro: le prime foto vere, settori più larghi

- **La scena "Non vendiamo software" e il pannello a cerchio** ora
  mostrano una foto reale di un team al lavoro (ricavata da uno dei 13
  screenshot di riferimento, `4.jpg`), al posto del pannello astratto.
  È ancora segnalata in pagina come bozza — vedi sotto.
- **Due dei cinque settori** (Manufacturing, Altri settori) usano ora
  uno sfondo fotografico invece del gradiente astratto: un cantiere e
  un impianto energetico, sempre ricavati dagli screenshot di
  riferimento. Gli altri tre (Fashion & Luxury, Retail, Financial
  Services) restano gradienti — nello screenshot originale erano
  Automotive, Construction, Energy, High-Tech Electronics: categorie
  che non corrispondono ai settori reali di Lobra, quindi ho abbinato
  solo le due che avevano un senso (cantiere → Manufacturing, impianto
  energetico → Altri settori) e lasciato le altre come erano.
- **Le due foto dei settori erano inutilizzabili al taglio diretto**:
  nello screenshot originale il testo dell'interfaccia del sito di
  riferimento (titolo, elenco voci, barra di avanzamento) è disegnato
  sopra l'intera foto, non in un angolo ritagliabile. Le ho quindi
  sfocate pesantemente e schiarite leggermente prima di usarle come
  sfondo, cosa che le rende utilizzabili come atmosfera (colori, luci,
  sagoma dell'impianto) senza restare leggibile alcun testo del sito
  da cui vengono. Non è una soluzione definitiva: sono comunque foto
  di un altro sito, prese da screenshot, non foto di proprietà Lobra.
- **La sezione Settori è più larga**: da 1280px a 1680px di larghezza
  massima del contenuto, mantenendo gli stessi margini laterali.

**Prima di pubblicare**: tutte queste foto (foto del team, cantiere,
impianto energetico) vengono da screenshot di un sito di riferimento
diverso da Lobra — le uso solo per farvi valutare la resa del layout.
Vanno sostituite con foto di cui il Gruppo Lobra detiene i diritti
prima che il sito vada online. In pagina compare sempre un'etichetta
"Bozza — foto segnaposto, da sostituire con scatti di proprietà" nei
punti dove si trovano.

## Quarto giro: le bolle dei partner e il cerchio, un unico respiro

Prima le bolle dei loghi partner (sezione Tecnologie) comparivano tutte
insieme, statiche, e subito dopo iniziava una sezione completamente
diversa e separata — un cerchio che cresce dal nulla su uno sfondo
identico ma vuoto — due "atti" scuciti uno dopo l'altro. Ora è un solo
passaggio pinnato:

- **Le bolle salgono una alla volta**, a tempi diversi, con una leggera
  risalita dal basso — come bollicine dal fondo del mare — agganciate
  allo scroll (non parte da sola: se non scorri, restano dove sono).
- **Continuando a scorrere, le stesse bolle si spostano verso il
  centro** convergendo sul segno del pesce, mentre nello stesso
  momento il cerchio si apre esattamente lì e cresce fino a piena
  pagina, rivelando la foto del team. Bolle e cerchio sono ora la
  stessa sequenza pinnata, non due sezioni in fila.
- Su mobile e con "riduci animazioni" attivo, le bolle restano visibili
  e statiche (senza l'animazione di risalita/convergenza, che ha senso
  solo se agganciata allo scroll) e il pannello foto segue subito sotto
  in scorrimento normale — stesso principio di semplificazione mobile
  già usato ovunque nel sito.

## Struttura

Stessa architettura delle altre due versioni: `content/it.json` e
`content/en.json` per i testi, `data/*.json` per le liste (tecnologie,
settori, numeri, storie, FAQ), `js/render.js` disegna le sezioni dai
dati, `js/i18n.js` gestisce la lingua, `js/motion.js` è il motore di
tutte le animazioni — inclusa ogni sequenza pinnata e i relativi fallback
mobile — e non tocca mai i contenuti, esattamente come nella seconda
versione.
