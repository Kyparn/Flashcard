# Restaurang J – dryckesbibliotek och personalquiz

## Kör lokalt på datorn

Kräver Node 22 eller senare och projektets npm-beroenden.

```sh
npm run build:web
npm run server
```

Öppna http://localhost:3001. Samma server levererar webbsidan, quizet och topplistan. Resultat lagras i `server/data/quiz.json`, som inte följer med Git. Ingen extern tjänst behövs.

Under gränssnittsutveckling kan Expo köras i en andra terminal med `npm run web`. Webbappen använder då samma värd på port 3001 för API:t. Vid behov anges adressen under kugghjulet på Quiz-fliken. För Expo Go på telefon kan adressen anges där eller via `EXPO_PUBLIC_API_URL`.

## Flera egna mobiler på samma wifi

```sh
npm run build:web
npm run server:lan
```

Öppna den `Mobile address` som terminalen visar på varje telefon, till exempel `http://192.168.1.20:3001`. Datorn behöver vara igång. Windows brandvägg måste tillåta Node på det privata nätverket. Ändra inte brandväggen för offentliga nätverk.

## Så fungerar quizet

- 10 olika drycker: 4 druvfrågor, 3 smakfrågor, 3 ursprungsfrågor.
- Varje fråga har fyra blandade alternativ och exakt ett rätt svar. En kryssruta markeras innan svaret bekräftas.
- Servern ger varje fråga 20 sekunder. För sent eller uteblivet svar räknas som fel. Att ladda om startar inte om klockan.
- Efter svaret visas förklaringen. Tiden mellan frågorna räknas inte.
- Namnet skrivs efter sista frågan. Resultatet visas inte på topplistan innan det sparats.
- Varje namns bästa runda rankas: antal rätt först, sedan sammanlagd svarstid. Försök med samma namn samlas, oavsett stora/små bokstäver.
- Poäng beräknas på servern. Dubbeltryck och återförsök ger inga extra poäng eller dubbla resultat.
- Det här är en första version för ett betrott team, med visningsnamn och utan inloggning. Namn är inte verifierade identiteter. Två personer med samma namn bör lägga till en initial.

## Datamodell och innehåll

`src/data/catalog.json` är det gemensamma registret som informationskorten och serverns quiz använder:

- `categories`: stabilt kategori-ID och visningsnamn.
- `drinks`: stabilt dryckes-ID, kategori-ID, namn, beskrivning, ursprung och priser.
- `grapes`: en druva per ID, exempelvis `grape-chardonnay`.
- `flavors`: en smakbeskrivning per ID, exempelvis `flavor-citrus`.
- `drinks[].grapes`: relationer med `grapeId` och eventuell andelsnotering.
- `drinks[].flavorIds`: referenser till smakregistret.

Ändra inte ett befintligt ID när ett namn eller en beskrivning uppdateras. Ett vin kan ha många druvor och smaktoner. Quizets falska druvsvar utesluter alla druvor som faktiskt är kopplade till vinet. Smakfrågor hänvisar uttryckligen till beskrivningen i vårt register och undviker alternativ ur samma närliggande smakfamilj.

`initialData.js` bygger kompatibla kort från registret. Ursprungliga kort-ID:n och kopplingar till inventeringen finns kvar. `legacyCardFingerprints.json` används för att konvertera gamla oförändrade informationskort utan att skriva över personliga ändringar. Hantera kort gäller lokala tillägg/anteckningar; tävlingsfrågorna hämtas enbart från det gemensamma registret. Registret ändras i projektet och distribueras med servern/webbbygget.

Dryckesuppgifterna är hämtade från appens befintliga innehåll; ingen ny faktagranskning av sortimentet har gjorts. Poster utan angivet ursprung får inga ursprungsfrågor.

## Railway, när det är dags

Projektet innehåller `Dockerfile` och `railway.toml`. Ingen publicering har gjorts.

1. Koppla repositoryt till en Railway-tjänst med projektroten som rotkatalog. Dockerfilen bygger webbappen och startar Node-servern.
2. Lägg till en beständig volym monterad på `/data`. Dockerfilen anger `DATA_DIR=/data`; resultatfilen måste ligga på volymen för att överleva en ombyggnad.
3. Kör en instans/replika. Den filbaserade databasen är avsedd för en serverprocess. Byt till en delad databas innan flera repliker används.
4. Servern lyssnar på Railways `PORT` och `0.0.0.0`. Hälsokontrollen är `/api/health`.
5. Skapa en HTTPS-domän och dela den med personalen. Webbsida och API använder samma domän. Vid separat klientdomän måste `ALLOWED_ORIGINS` ange tillåtna ursprung, kommaseparerade.
6. Planera backup av volymen. Före öppen tävling utanför teamet bör personalidentitet/inloggning och begränsning av missbruk införas.

Railway-referenser: [Dockerfiles](https://docs.railway.com/builds/dockerfiles), [beständiga volymer](https://docs.railway.com/volumes), [hälsokontroller](https://docs.railway.com/deployments/healthchecks).

## Kontroller

```sh
npm test
npm run build:web
```

Serverns dataplats kan ändras med `DATA_DIR`. Starta aldrig två serverprocesser med samma resultatfil. Native-appar behöver dessutom provköras på faktiska telefoner.
