# Gabbypeli

Suomenkielinen Gabbyn nukketalo -fanipeli yhteisiin leikkihetkiin. Yhdeksän leikkiä, suomenkieliset ohjeet, rauhalliset vihjeet ja selaimeen tallentuva tarrakirja.

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

GitHub Actions ajaa tyyppitarkistuksen, tallennuksen regressiotestit sekä oikeat Chromium-selaintestit. Selaintestit kattavat pelien päätoiminnot, 320–1100 pikselin näkymiä, vihjeet, äänten mykistyksen, asetukset ja tarrakirjan säilymisen. Testiajon kuvat löytyvät browser-results-artefaktista.

## Pelit

- Muistipeli 2–4 parilla, kahdella kuvapakalla, animoidulla käännöllä ja automaattisesti sulkeutuvilla väärillä pareilla
- Palapelit 15 kuvalla, 2–6 palalla, raahauksella ja paikkavihjeellä
- Pikku puuhat, värit, muodot ja laskeminen
- Kuvanetsintä kuuden hahmon yksityiskohdista
- Suurten ja pienten pallojen vertailu
- Hileen leipomo, jossa kakut tehdään ja lasketaan itse
- Merikatin kuplataika, jossa tunnistetaan värejä ja muotoja kuplia napauttamalla tai niiden yli pyyhkäisemällä
- Taidepöytä sormipiirroksiin, tassuleimoihin ja kuuden hahmon tarrapolkuihin
- Puutarha, jossa kukat avataan pyyhkäisemällä

## Äänet

Aikuiselle-valikossa voi säätää valmiiden puheäänitteiden ja tehosteiden toistoa sekä äänenvoimakkuutta. Asetukset ja tarrat tallentuvat tähän selaimeen.

Peli toistaa vain nykyiset Gabby-äänitteet. Äänitteet on luetteloitu tiedostoissa `assets/audio/manifest.json` ja `assets/audio/script.json`; muiden hahmojen repliikit eivät ole pelin käytössä. Automaattista laitepuhesynteesiä ei käytetä. Jos Gabby-äänitettä ei ole, ohje välittyy kuvasta ja animaatiosta.

## Tiedostot

- `src/games/` sisältää erilliset leikkimoduulit
- `src/types.ts` määrittelee pelitilan ja tehtävien tietotyypit
- `src/audio.ts` huolehtii puheesta, äänitiedostoista ja tehosteista
- `src/storage.ts` tallentaa asetukset ja ansaitut tarrat
- `src/navigation.ts` vaihtaa leikkejä
- `src/styles.css` sisältää ulkoasun
- `assets/characters.webp`, `assets/gabby-friends.webp` ja `assets/play-objects.webp` sisältävät hahmo- ja esinekuvitukset

Peliä kehitetään henkilökohtaisena faniprojektina. Projektiin ei ole lisätty avointa lisenssiä.
