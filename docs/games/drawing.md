# Taidepöytä

`drawing` · Hiekkalaatikko · [drawing.ts](../../src/games/drawing.ts)

## Pelisäännöt

Taidepöytä avautuu nukketalon huonepainikkeesta. Leikissä valitaan väri, normaali tai paksu kynä, tassuleima tai yksi kuudesta hahmoleimasta. Pelaaja piirtää canvasille ja voi kumota viimeisen vedon. Kun paperilla on vähintään yksi veto, siitä tulee siirrettävä piirustus. Vedä piirustus kehykseen tai käytä sitä näppäimistöllä. Juhlaruutu näyttää saman kuvan. Vedot ovat muistissa ja nollataan uutta kuvaa aloitettaessa. Rajat ovat 300 vetoa ja 3 000 pistettä per veto.

## Assetit ja käyttötilanteet

| Käyttö | Assetti tai toteutus |
| --- | --- |
| Huonevalinta | `home/room_art` |
| Valmis kuva ja kehys | Pieni canvas näyttää saman piirustuksen siirron aikana. Kehys on CSS:llä piirretty pudotuskohde. Juhlaruutu käyttää alkuperäiseltä piirustuspaperilta tuotettua kuvaa |
| Paperi, värivalinta ja työkalut | HTML-canvas, CSS-paletti ja SVG-kuvakkeet. Piirtoviiva, tassuleima ja hahmoleiman tähdet piirretään canvasilla |
| Hahmoleiman valinta ja veto | Kuusi `friends/`-kuvaa. Canvas lataa kuvat erikseen ja piirtää vedot uudelleen kuvan latauduttua |
| Ohje ja palaute | Aloitusrepliikki puhehaulla, ensimmäinen veto käyttää `sprinkle`-tehostetta. Voittokuvana Gabby |

Yhteiset [atlas-, puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Testaa huonepainike, kynä ja leimat, kuvan lataus, yhden vedon kumoaminen, kosketus, kapea näyttö ja siirtyminen pois kesken vedon.
