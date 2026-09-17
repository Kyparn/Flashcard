# Restaurang J – dryckesbibliotek och personalquiz

## Mobilversion: öva på egen hand

Den aktiva appen hämtar korten från det medföljande dryckesregistret och kör quizet direkt på enheten. Ingen API-server, inloggning eller topplista behövs. Quizresultat visas efter rundan men sparas inte; omladdning börjar om. Kortredigering och inventering sparas lokalt på respektive enhet och delas inte med andra. Tidigare serverdata lämnas kvar.

Kör `npm run mobile` och öppna adressen märkt `Mobile (same Wi-Fi)` på mobilen. Datorn och mobilen måste använda samma wifi och terminalen behöver vara igång. På datorn används http://localhost:3002. Adressen `localhost` på mobilen pekar på mobilen själv, inte datorn. Om Windows frågar behöver Node tillåtas på det privata nätverket.

`npm run build:web` skapar även en fristående webbversion i `dist` som senare kan publiceras på statisk hosting, exempelvis Netlify. Då behövs inte datorn för att öppna sidan. Ingen publicering görs av dessa kommandon. Första laddningen kräver åtkomst till webbsidan; installation och offlinecache ingår inte.

## Tidigare serverversion (referens)

Beskrivningen nedan gäller den kvarvarande serverkoden för gemensam inventering och tävling. Den används inte av den aktiva mobilversionen. För dess lokala test körs `npm run build:web` följt av `npm run server`.

## Kör lokalt på datorn

Starta den fristående mobilversionen i ett steg:

```sh
npm run local
```

Öppna http://localhost:3002 och låt terminalen vara igång under testet. Netlify-adressen påverkas inte. Även `npm run web` kan nu köra kort och övningsquiz utan separat API-server.

Kräver Node 22 eller senare och projektets npm-beroenden.

```sh
npm run build:web
npm run server
```

Öppna http://localhost:3001. Samma server levererar webbsidan, kortbiblioteket, inventeringen, quizet och topplistan. Gemensamma kort, inventering och quizresultat lagras i `server/data/quiz.json`, som inte följer med Git. Ingen extern tjänst behövs.

## Gemensamma kort och inventering

Alla enheter som ansluter till samma server använder samma kortbibliotek och inventering. Kort kan läggas till, redigeras och tas bort under Hantera kort. Inventeringens antal, priser, nya varor och borttagningar sparas för hela teamet. Rensa räkning nollställer teamets gemensamma antal.

Hämta andra användares ändringar med uppdateringsknappen. Inventeringen och startsidans kortantal hämtas även när fliken öppnas igen. Detta är inte automatisk realtidssynkning. Vid konflikt på samma post stoppas ändringen med ett meddelande; hämta senaste och gör ändringen igen. I kortdialogen: stäng dialogen och tryck på uppdateringsknappen. Ändringar i olika poster kan sparas samtidigt utan att skriva över varandra.

Servern måste vara tillgänglig för läsning och sparning. Inventeringen visar osparade uppgifter och ett felmeddelande om sparningen misslyckas. Hämta senaste återställer då skärmen till serverns sparade data efter bekräftelse.

Första serverstarten lägger in projektets 96 kort och 109 inventeringsvaror, inklusive de tio spritsorterna i `src/data/inventering-produkter.json`. Spritpriserna anges i kr/cl och nya inventeringar börjar med tomma antal. Befintliga quizresultat bevaras. Senare omstarter återställer inte borttagna poster. Tidigare personliga ändringar i webbläsarens/telefonens lokala lagring lämnas kvar men importeras inte automatiskt till teamets bibliotek. `src/utils/storage.js` finns kvar för den äldre lokala lagringen; de aktiva kortvyerna använder `sharedStorage.js`.

API: `GET /api/categories`, `GET /api/cards`, `GET /api/inventory`. De två sistnämnda tar också `POST` med `{ "changes": [{ "id": "…", "before": {…}, "after": {…} }] }`. `before: null` skapar, `after: null` tar bort. Klienten skickar sin tidigare version av varje ändrad post; servern svarar 409 om den inte längre stämmer. Hela anropet sparas atomiskt. Upprepning av redan genomförda ändringar är säker.

Versionen är avsedd för ett betrott team: alla som når servern kan ändra kort och inventering. Inloggning och behörigheter ingår inte. Kör en serverprocess och säkerhetskopiera hela datafilen/volymen.

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

`initialData.js` bygger kompatibla kort från registret för lokal referensdata. Servern använder samma kortgenerator när det gemensamma biblioteket skapas första gången. Hantera kort ändrar teamets gemensamma informationskort; tävlingsfrågorna hämtas fortsatt enbart från det strukturerade dryckesregistret. Registret ändras i projektet och distribueras med servern/webbbygget. En ändring av registrets standardkort skriver inte över redan sparade gemensamma kort.

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
