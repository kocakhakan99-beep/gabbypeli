# Pikku puuhat

`learn` · Piilotettu Hiekkalaatikon toteutus · [learning.ts](../../src/games/learning.ts)

## Pelisäännöt

Yhdeksän puuhaa etenee [tehtäväluettelon](../../src/data.ts) järjestyksessä. Teemoja ovat värit, muodot, määrät, kuvajono ja esineen käyttötarkoitus. Valinnat sekoitetaan joka tehtävällä. Väärä valinta poistuu käytöstä ja muut korostuvat. Oikea vastaus lukitsee valinnat ja siirtää seuraavaan tehtävään tai juhlaan. Huonepainike on piilotettu.

## Assetit ja käyttötilanteet

| Käyttö | Assetti tai toteutus |
| --- | --- |
| Huone-esikatselu, tehtävä ja kuvajono | Piilotettu huone käyttää junaa ja Kisukeijua. Potretti tulee tehtävän hahmoviitteestä. Kuvajono ja sen vastausvaihtoehdot käyttävät Gabby- ja Hile-kuvia |
| Vastausvaihtoehdot | CSS-pallot, kuppikakut ja muodot sekä `objects/`-kuvat esinetehtävissä. Painiketeksti kertoo vaihtoehdon nimen |
| Ohje, väärä ja oikea vastaus | Puhehaku tehtävän `speech`- ja `win`-teksteillä, väärässä vastauksessa lisätään etuliite. Oikea vastaus käyttää `bubble`-tehostetta. Voittokuvana Gabby |

Yhteiset [puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Jos huone palautetaan käyttöön, tarkista oikea vastaus ja virhetila jokaisessa tehtävätyypissä sekä kuvajonon näkyvyys vain omassa tehtävässään. Päivitä julkista huonepainiketta käyttävät [navigointitestit](../../tests/browser/game.spec.js) vastaamaan julkaisutilaa.
