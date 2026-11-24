# Gabbypeli

Suomenkielinen Gabbyn nukketalo -fanipeli yhteisiin leikkihetkiin. Viisi avattavaa leikkiä, suomenkieliset ohjeet ja selaimeen tallentuva tarrakirja.

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

## Pelit ja dokumentaatio

Nukketalosta avautuvat Muistipeli, Palapeli, Kuka piilottelee?, Kisukeijun puutarha ja Hileen leipomo. Jokainen niistä toimii Seikkailussa ja Hiekkalaatikossa.

[Dokumentaatiohakemistosta](docs/README.md) löytyvät kaikkien yhdeksän toteutetun leikin speksit, julkaisutilat, assettien käyttökohteet ja testit. [AGENTS.md](AGENTS.md) määrittää, milloin dokumentaatio päivitetään koodin yhteydessä.

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
- `assets/friends/`, `assets/objects/`, `assets/menu/` ja `assets/stickers/` sisältävät erilliset hahmo-, esine-, valikko- ja tarrakuvat

Peliä kehitetään henkilökohtaisena faniprojektina. Projektiin ei ole lisätty avointa lisenssiä.
