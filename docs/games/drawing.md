# Taidepöytä

`drawing` · Koristehuone, pelin aloitus pois käytöstä · [drawing.ts](../../src/games/drawing.ts)

## Pelisäännöt

Nykyinen nukketalo näyttää koristehuoneen. Piilotettu pelipainike ja `open("drawing")` palauttavat kotiin. Moduulin toteuttamassa leikissä valitaan väri, normaali tai paksu kynä, tassuleima tai yksi kuudesta hahmoleimasta. Pelaaja piirtää canvasille ja voi kumota viimeisen vedon. Kuva voidaan merkitä valmiiksi, kun siinä on vähintään yksi veto. Vedot ovat muistissa ja nollataan uutta kuvaa aloitettaessa. Rajat ovat 300 vetoa ja 3 000 pistettä per veto.

## Assetit ja käyttötilanteet

| Käyttö | Assetti tai toteutus |
| --- | --- |
| Näkyvä koristehuone | `home/room_art`. Piilotetun pelipainikkeen kuvissa lankakerä ja Gabby |
| Paperi, värivalinta ja työkalut | HTML-canvas, CSS-paletti ja SVG-kuvakkeet. Piirtoviiva, tassuleima ja hahmoleiman tähdet piirretään canvasilla |
| Hahmoleiman valinta ja veto | Kuusi `friends/`-kuvaa. Canvas lataa kuvat erikseen ja piirtää vedot uudelleen kuvan latauduttua |
| Ohje ja palaute | Aloitusrepliikki puhehaulla, ensimmäinen veto käyttää `sprinkle`-tehostetta. Voittokuvana Gabby |

Yhteiset [atlas-, puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Pidä koristehuoneen julkaisutila näkyvänä speksissä. Jos peli avataan, testaa kynä ja leimat, kuvan lataus, yhden vedon kumoaminen, kosketus, kapea näyttö ja siirtyminen pois kesken vedon.
