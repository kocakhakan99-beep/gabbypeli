# Gabbypeli

Suomenkielinen, henkilökohtaiseen käyttöön tehty Gabbyn nukketalo -fanipeli.

## Käynnistys

Vaatii Node.js 20+ testeihin ja Python 3:n paikalliseen palvelimeen.

```sh
npm start
```

Avaa http://127.0.0.1:8000. ES-moduulit tarvitsevat HTTP-palvelimen; index.html-tiedoston kaksoisnapsautus ei riitä. Ei asennettavia npm-riippuvuuksia.

```sh
npm test
```

## Rakenne

- `src/main.js`: käynnistys ja yhteisten painikkeiden tapahtumat
- `src/navigation.js`: leikin vaihto ja paluu alkuun
- `src/games/`: muistipeli, palapeli, pikku puuhat ja kuvanetsintä
- `src/audio.js`: suomenkielinen puhesynteesi ja äänitehosteet
- `src/ui.js`: yhteiset käyttöliittymän apufunktiot
- `src/state.js`: yhteinen pelitila
- `src/data.js`: hahmot ja suomenkieliset tehtävät
- `src/dom.js`: juurielementti ja rajattu elementtihaku
- `src/utils.js`: sekoittaminen
- `src/styles.css`: ulkoasu ja responsiivisuus
- `assets/characters.webp`: pelin kuvitus
- `tests/game.test.js`: pelien toiminnalliset regressiotestit kevyellä DOM-mallilla

Moduulijako säilyttää nykyisen pelin: muistipeli 2–4 parilla, palapeli 2/4/6 palalla, kuvanetsintä ja kuusi oppimistehtävää. Ei ajastettuja rangaistuksia tai emojeita.

Testit kattavat pelikulut, väärät valinnat, uusinnan, suomenkielisen puheen valinnan ja mykistyksen. Ne eivät korvaa selaimen visuaalista tarkistusta tai oikean laitteen äänen testausta.

## Äänet

Puhe käyttää selaimen `speechSynthesis`-rajapintaa ja ensisijaisesti fi-FI-ääntä. Erillisiä sarjan hahmoäänitteitä ei ole. Äänitoiminnot on erotettu tulevia äänitiedostoja varten.

## Yksityinen GitHub-repo

Kun GitHub CLI on kirjautunut omalle tilillesi, voit luoda yksityisen repon ja siirtää tämän commitin:

```sh
gh repo create gabbypeli --private --source=. --remote=origin --push
```

Kuvitus on tätä henkilökohtaista fanipeliä varten tuotettua kuvitusta. Projektiin ei ole lisätty avointa lisenssiä.
