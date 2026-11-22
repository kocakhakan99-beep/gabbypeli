# Gabbypeli

Suomenkielinen Gabbyn nukketalo -fanipeli yhteisiin leikkihetkiin. Seitsemän leikkiä, suomenkieliset ohjeet, rauhalliset vihjeet ja selaimeen tallentuva tarrakirja.

## Kehittäminen

Tarvitset Node.js 22:n ja Python 3:n.

```sh
npm ci
npm start
```

Avaa http://127.0.0.1:8000. Lähdekoodi on `src/`-hakemiston TypeScript-tiedostoissa. `npm run build` tarkistaa tyypit ja tuottaa selaimessa käytettävät tiedostot `app/`-hakemistoon. `app/` on versioitu, jotta nykyinen GitHub Pagesin main-haaran juurihakemiston julkaisu toimii ilman erillistä palvelinta. Aja build aina lähdekoodimuutosten jälkeen ennen commitia.

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
```

GitHub Actions ajaa tyyppitarkistuksen, tallennuksen regressiotestit sekä oikeat Chromium-selaintestit. Selaintestit kattavat kaikki seitsemän leikkiä, 320–1100 pikselin näkymiä, vihjeet, äänten mykistyksen, asetukset ja tarrakirjan säilymisen. Testiajon kuvat löytyvät browser-results-artefaktista.

## Pelit

- Muistipeli 2–4 parilla ja kurkistusvihjeellä
- Palapelit 2, 4 ja 6 palalla sekä paikkavihjeellä
- Pikku puuhat, värit, muodot ja laskeminen
- Kuvanetsintä hahmojen yksityiskohdista
- Suurten ja pienten pallojen vertailu
- Hileen leipomo, jossa kakut tehdään ja lasketaan itse
- Merikatin kuplataika, jossa tunnistetaan värejä ja muotoja

## Äänet

Aikuiselle-valikossa säädetään puhetta, tehosteita, äänenvoimakkuutta ja laitteen suomenkielistä puheääntä. Asetukset ja tarrat tallentuvat tämän selaimen localStorageen. Peli toimii myös tallennuksen ollessa estettynä.

`src/audio.ts` toistaa ensisijaisesti `assets/audio/manifest.json`-tiedostoon merkityt MP3-äänitteet. Muut ohjeet luetaan laitteen puhesynteesillä. Manifestissa on 91 valmista suomenkielistä peliääntä ja Gabby–Hile-vuoropuhelu. Osa puheohjeista on äänitetty lyhyempinä. Alkuperäinen ohje ja puhuttu versio on kirjattu assets/audio/script.json-tiedostoon. Sarjan ääninäyttelijöiden äänitteitä ei sisälly projektiin.

### Tuota suomenkieliset puheäänitteet

Puheäänitteet voidaan tuottaa ElevenLabsin APIlla omalla valitulla äänellä. Äänivalinta tehdään ElevenLabs-tilillä. Avaimet kuuluvat vain kehityskoneen ympäristömuuttujiin.

```sh
npm run audio:plan
```

Komento näyttää puherepliikit ja merkkimäärän tekemättä API-kutsuja. Seuraava komento vaatii ympäristömuuttujat `ELEVENLABS_API_KEY` ja `ELEVENLABS_VOICE_ID`.

```sh
npm run audio:generate -- --limit=10
```

Generointi käyttää oletuksena mallia `eleven_multilingual_v2`, joka tukee suomea. Mallin voi vaihtaa muuttujalla `ELEVENLABS_MODEL_ID`. Kutsut voivat kuluttaa palvelun krediittejä. Skripti tuottaa enintään kymmenen puherepliikkiä kerralla, käyttää jo tuotetut uudelleen ja tallentaa onnistuneet tulokset jokaisen kutsun jälkeen. Puhetta tuottavan palvelun avaimia ei toimiteta selaimeen. Commitoi vain valmiit MP3-tiedostot ja päivitetty manifesti.

Repliikkilista kerätään lähdekoodin kiinteistä puheohjeista ja tärkeimmistä laskemisohjeista. Dynaamiset ohjeet, joille ei ole valmista äänitettä, toimivat laitteen puheäänellä.

API-ohjeet https://elevenlabs.io/docs/api-reference/text-to-speech/convert

## Tiedostot

- `src/games/` sisältää erilliset leikkimoduulit
- `src/types.ts` määrittelee pelitilan ja tehtävien tietotyypit
- `src/audio.ts` huolehtii puheesta, äänitiedostoista ja tehosteista
- `src/storage.ts` tallentaa asetukset ja ansaitut tarrat
- `src/navigation.ts` vaihtaa leikkejä
- `src/styles.css` sisältää ulkoasun
- `assets/characters.webp` sisältää peliä varten tuotetun kuvituksen

Peliä kehitetään henkilökohtaisena faniprojektina. Projektiin ei ole lisätty avointa lisenssiä.
