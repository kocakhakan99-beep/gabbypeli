# Muistipeli

`memory` · Seikkailu ja Hiekkalaatikko · [memory.ts](../../src/games/memory.ts)

## Pelisäännöt

Katso korttien kuvia enintään 5,2 sekuntia tai piilota kortit heti. Käännä kaksi korttia. Pari jää näkyviin ja väärä pari sulkeutuu viiveellä. Vihje näyttää jäljellä olevien korttien kuvat hetkeksi. Kaikki parit avaavat voittoruudun.

Hiekkalaatikossa valitaan kaverit (2–6 paria), esineet (2–9) tai molemmat (2–9). Seikkailussa tasot 1–5 käyttävät kavereita ja 6–10 sekapakkaa. Parimäärät ovat järjestyksessä 2, 3, 3, 4, 5, 5, 6, 7, 8 ja 9.

## Assetit ja käyttötilanteet

| Käyttö | Assetti ja varanäkymä |
| --- | --- |
| Huonevalinta, kartta ja pelin otsikko | `home/room_memory`, kapealla leikkihuonetausta ja leveällä yhteinen Seikkailupolku, Hileen potretti |
| Kortin selkä ja kuvapuoli | `memory-puzzle/card_back_purple` Phaserissa, DOM-kehykset `card_back_purple.webp` ja `card_front.webp` saman ryhmän erilliskuvina |
| Esikatselu, kääntö, vihje ja löytynyt pari | `memoryFrames` valitsee Gabbyn, Pandin, Hileen, mansikan ja tähden atlasframet. Samat kuvat löytyvät DOMille erilliskuvina. Muu pakka käyttää hahmo- ja esinekuvia |
| Pakka- ja parivalinta | `controls`-kehykset sekä SVG-kuvakkeet ja lukumäärä |
| Ohje ja palaute | Puhehaku esikatselussa, käännössä, vihjeissä ja paripalautteessa. Kaveripakka käyttää myös dynaamista hahmon nimeä ja omia väärän parin repliikkejä. Pari käyttää `pair`-tehostetta. Gabby voittokuvana |

Yhteiset [atlas-, puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Tarkista esikatselun ohitus, väärän parin sulkeutuminen, vihje, erikokoiset pakat ja ensimmäinen tasosuoritus. Tarkista poistuminen ajastimen tai Phaser-latauksen aikana. [Pelitestit](../../tests/browser/expansion.spec.js), [Phaser-testi](../../tests/browser/phaser-room.spec.js)
