# Palapeli

`puzzle` · Seikkailu ja Hiekkalaatikko · [puzzle.ts](../../src/games/puzzle.ts)

## Pelisäännöt

Raahaa pala oikeaan paikkaan tai valitse pala ja sitten paikka. Haalea mallikuva ja vihje ohjaavat sovittamista. Kaikkien palojen asettaminen päättää pelin. Hiekkalaatikossa on 15 kuvaa (kuusi hahmoa ja yhdeksän esinettä) ja 2, 4 tai 6 palaa. Seikkailu käyttää kuvia luettelon järjestyksessä, yhden per taso. Tasoilla 1–3 on kaksi, 4–6 neljä ja 7–10 kuusi palaa.

## Assetit ja käyttötilanteet

| Käyttö | Assetti ja varanäkymä |
| --- | --- |
| Huonevalinta, kartta ja asetukset | `home/room_puzzle`, kapealla leikkihuonetausta ja leveällä yhteinen Seikkailupolku, `controls` Hiekkalaatikon palamäärän valintaan. Aihepainikkeet käyttävät tavallisia hahmo- ja esinekuvia |
| Pelialusta, irtopalat ja paikoilleen asetetut palat | Kokokuva `friends/`- tai `objects/`-hakemistosta, Pandille ja kuppikakuille `gabby/images/puzzle-panda.webp` ja `puzzle-cupcake.webp`. Phaser jakaa tekstuurin kahteen sarakkeeseen. DOM leikkaa saman kuvan CSS:llä. Valmiin kuvan paljastus käyttää tavallista aihekuvaa |
| Vihje ja kohdistus | CSS:n haalea taustapala sekä pala- ja paikkakorostukset. Kuvassa on säilytettävä tunnistettavat alueet kaikilla kolmella ruudukolla |
| Ohje ja palaute | Puhehaku aloituksessa, palan valinnassa, sovituksessa, vihjeessä ja valmistuessa, asetuksessa `piece`. Potretti kuvavalinnan hahmosta tai Kisukeijusta esinekuvissa |

Yhteiset [atlas-, puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Tarkista kaikki palamäärät, näppäimistövalinta, kosketusraahaus, väärään paikkaan pudotus, vihje ja kuvan rajaus. Varmista Phaser-näkymän purku pelistä poistuttaessa. [Pelitestit](../../tests/browser/expansion.spec.js), [eletestit](../../tests/browser/gestures.spec.js), [Phaser-testi](../../tests/browser/phaser-room.spec.js)
