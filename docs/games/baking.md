# Hileen leipomo

`baking` · Seikkailu ja Hiekkalaatikko · [baking.ts](../../src/games/baking.ts)

## Pelisäännöt

Hiekkalaatikossa valitaan piparit tai kuppikakut. Seikkailu vuorottelee reseptejä pipareista alkaen ja kasvattaa annoksia kahdesta kuuteen sekä sekoittamisen työmäärää. Hiekkalaatikossa on kuusi annosta.

Pese kädet, siirrä jauhot, muna ja maito kulhoon, sekoita pyörittämällä, aseta leivinpaperi, täytä pelti, avaa uuni ja työnnä pelti sisään, sulje luukku ja säädä lämpö (piparit 175 °C ja kuppikakut 200 °C). Paiston jälkeen avautuu voittoruutu. Siirrot, sekoitus ja luukku toimivat myös Enterillä tai välilyönnillä. Nupin lämpöä nostetaan nuolilla.

## Assetit ja käyttötilanteet

| Käyttö | Assetti ja varanäkymä |
| --- | --- |
| Huonevalinta, kartta ja keittiö | `home/room_bakery`, `rooms/bakery-map-tall.webp`, `rooms/bakery-map-wide.webp`, `rooms/kitchen.webp`, `room-kitchen.webp` ja Hileen potretti |
| Reseptivalinta ja raaka annos | `bakery/batter_dollop_large` pipareille ja `bakery/raw_pink` kuppikakuille. Sama tunniste kulkee reseptivalinnasta pellille ja uuniin |
| Saippua, huuhtelu ja odotus | `furniture/soap.webp`, `furniture/tap.webp`. Kädet ja varanäkymä CSS:llä, Phaser piirtää kuplat ja veden. Aloituksessa Gabbyn tervehdys puhehaulla |
| Aineiden siirto ja sekoitus | CSS-aineet ja atlaksen kulhot `bowl_empty`, `bowl_flour`, `bowl_egg`, `bowl_batter`. `spoon` DOMissa ja Phaserissa, sekoituksen mittari DOMissa |
| Paperi, pelti ja annosten paikat | `parchment`, `tray` ja reseptin annosframe. Phaser näyttää pellillä paperin ja asetetut annokset, DOM säilyttää samat tilat |
| Uunin käyttö ja paisto | `oven_body`, `oven_door_frame`, `oven_glass`, `oven_handle`, `oven_rack`, `oven_light`, `temperature_knob`. CSS ohjaa luukkua ja paiston valoa. Phaser näyttää lastatun pellin annokset |
| Toimintopalaute ja valmistuminen | `piece` vaihetoiminnoissa. Yhteinen juhlanäkymä ja Hileen voittokuva. Vaiheohjeet näkyvät ruudulla |

Yhteiset [atlas-, puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Pelaa molemmat reseptit, mukaan lukien pesun järjestys, paperi ennen annoksia, luukku ennen lämpöä ja oikea tavoitelämpö. Tarkista raahaus ja näppäimistö sekä poistuminen huuhtelun, paiston tai Phaser-latauksen aikana. [Pelitestit](../../tests/browser/expansion.spec.js), [eletestit](../../tests/browser/gestures.spec.js), [äänitestit](../../tests/browser/narration.spec.js)
