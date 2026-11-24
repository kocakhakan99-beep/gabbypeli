# Hileen leipomo

`baking` · Seikkailu ja Hiekkalaatikko · [baking.ts](../../src/games/baking.ts)

[Leipomon kehityssuunnitelma](baking-development.md) sisältää tilausten järjestyksen ja V5-erän kuvakatselmuksen. [Resepti- ja tasomääritykset](../../src/games/baking-recipes.ts) ovat pelin lähde.

## Pelisäännöt

- Hiekkalaatikossa valitaan piparit, kuppikakut, korvapuustit tai marjatortut. Ennen reseptiä voi valita 1–6 annosta tai reseptin oletuksen sekä kytkeä käsienpesun, taikinan teon ja koristelun erikseen päälle tai pois. Marjatorttu tehdään yhteen vuokaan ja täytetään paiston jälkeen myös ilman koristeita. Oletusasetuksilla kaikki työvaiheet ovat mukana.
- Seikkailun tasot 1–2 ovat pipareita, 3–4 kuppikakkuja, 5–6 korvapuusteja ja 7–8 marjatorttuja. Taso 9 on neljän kuppikakun tilaus, jonka ensimmäinen koriste on mustikka. Tasolla 10 pelaaja valitsee reseptin. Jokaisella tasolla reseptikortti kertoo tilauksen ja määrän. Vedä kortti tilaustelineeseen. Johdantotasoilla käytetään valmiiksi sekoitettua taikinaa.
- Pesussa liikutetaan hanan vipua sivulle, painetaan pumppua alas, hangataan käsiä edestakaisin, käännetään hanaa huuhteluun ja vedetään pyyhe käsien päälle. Pesu tehdään kerran samalla Seikkailukäynnillä. Taso 1 opastaa pesun jokaisella kerralla. Käynti päättyy, kun leipomon kartalta siirrytään muualle tai sivu ladataan uudelleen. Uusi Hiekkalaatikkokäynti alkaa pesusta.
- Valmista taikina jauhoista, munasta ja maidosta tilauksen mukaan. Molemmat sekoitussuunnat kerryttävät mittaria. Piparit kaulitaan ja muotoillaan. Kuppikakkuvuoat asetetaan ja täytetään. Korvapuustien levy täytetään, rullataan ja leikataan. Marjatorttu painellaan vuokaan. Piparit ja pullat siirretään leivinpaperille. Muut leivonnaiset paistetaan omissa vuoissaan.
- Luukku avataan ja suljetaan ennen lämmön säätöä. Piparit ja torttu paistetaan 175 °C:ssa, kuppikakut ja korvapuustit 200 °C:ssa. Korvapuustit kohoavat automaattisesti pidemmissä tilauksissa. Koristeet vedetään leivonnaisen päälle. Koristelu ja täyttö tapahtuvat paiston jälkeen, kun tilaus niitä edellyttää. Valinnat näkyvät tulosruudulla.
- Siirrot, työvälineet ja luukku toimivat kosketuksella tai näppäimistöllä. Nupin lämpöä nostetaan nuolilla. Uuden Seikkailutason palkinto ja tallennus käyttävät entistä sääntöä. Uusinta alkaa alusta.

## Assetit ja käyttötilanteet

| Käyttö | Assetti ja varanäkymä |
| --- | --- |
| Huonevalinta, kartta ja keittiö | `home/room_bakery`, `rooms/bakery-map-tall.webp`, `rooms/bakery-map-wide.webp`, `rooms/kitchen.webp`, `room-kitchen.webp` ja Hileen potretti |
| Reseptivalinta ja tilaus | Valmiiden leivonnaisten kuvat. Määrä ja koristelutoive näytetään DOM-tekstinä |
| Piparien muotoilu ja koristelu | `dough`, `rolling-pin`, `cookie-sheet`, `cat-cutter`, `cat-cutout`, `cookie-sprinkle`, `cookie-star` |
| Kuppikakkujen täyttö ja koristelu | `cupcake-tray`, `liner`, `filled-liner`, `frosting`, `cupcake-blueberry`, `cupcake-strawberry` |
| Korvapuustien muotoilu, kohotus ja paisto | `bun-sheet`, `bun-filling`, `bun-log`, `bun-raw`, `bun-proofed`, `bun-baked`, `bun-glazed`. Tarjotinkuvat havainnollistavat tilaa ja tilauksen määrä on tekstinä |
| Torttupohja, täyte ja marjat | `tart-dough`, `tart-pan`, `tart-raw`, `tart-shell`, `tart-cream`, `tart-blueberry`, `tart-strawberry`, `tart-raspberry`, `tart-red`, `tart-raspberry-result`, `tart-mixed`, `tart-slice`. Kahden marjan tilauksessa tuloksena on yleinen sekamarjatorttukuva sekä valintojen nimet |
| Saippua, huuhtelu ja odotus | `furniture/soap.webp`, `furniture/tap.webp`. V5:n `sink`, `towel`, `hands-clean`, `hands-soapy`, `hands-wet` ja `hands-dry` näyttävät pesualtaan sekä käsien ja kuivauksen vaiheet. Nykyiset hana- ja saippuakuvat jaetaan CSS-rajauksella kiinteään runkoon ja liikkuvaan vipuun tai pumpun päähän. Kädet liikkuvat hankausvedon mukana. Pyyhe on erillinen siirtoesine ja vesi piirretään omana tehostekerroksena. Aloituksessa Gabbyn tervehdys puhehaulla |
| Aineiden siirto ja sekoitus | `bakery/flour_sack`, `bakery/egg_whole` ja `bakery/milk_bottle` näkyvät nimettyjen siirtopainikkeiden kuvituksena. Erilliskuvat toimivat varakuvina ja nimet säilyvät näkyvissä. Aineen siirtäminen piilottaa sen painikkeen. Kulhon tilat ovat `bowl_empty`, `bowl_flour`, `bowl_egg`, `bowl_batter`. `spoon` DOMissa ja Phaserissa, sekoituksen mittari DOMissa |
| Paperi, pelti ja annosten paikat | `parchment`, `tray` ja reseptin annosframe. Phaser näyttää pellillä paperin ja asetetut annokset, DOM säilyttää samat tilat |
| Uunin käyttö ja paisto | `oven_body`, `oven_door_frame`, `oven_glass`, `oven_handle`, `oven_rack`, `oven_light`, `temperature_knob`. V4:n runko, keskipisteestään pyörivä nuppi, ritilä sekä samankokoiset luukun kehys, lasi ja kahva korvaavat vanhat kuvat samoilla atlasavaimilla ja erilliskuvapoluilla. CSS skaalaa osat yhdessä. Luukku avautuu alareunan ympäri ja kaksi näkyvää saranaa pysyvät aukon alareunassa luukun liikkuessa. Näytön lämpötila on DOM-tekstiä. Nykyinen paistovalo syttyy tavoitelämmössä. Phaser näyttää paperille lastatun pellin annokset. Muotoiltujen vuokien annokset näkyvät DOMissa |
| Toimintopalaute ja valmistuminen | `piece` vaihetoiminnoissa. Yhteinen juhlanäkymä näyttää Hileen ja reseptin tuloskuvan. `assets/gabby/bakery/results/` sisältää kissapiparin `baked_cookie_1.webp` ja kuppikakun `plain_cupcake_pink.webp`. Kuvien lähteet ovat samannimiset V5-framet arkistoista `bakery_cat_cookies.zip` ja `bakery_cupcakes.zip`. Ruudun otsikko ja palaute säilyvät kuvan latausvirheessä. Vaiheohjeet näkyvät ruudulla |

V5:n työvaihekuvat ovat erillisiä WebP-kuvia hakemistossa `assets/gabby/bakery/steps/`. Ne on rajattu vastaavista `bakery_handwash_station`-, `bakery_cat_cookies`-, `bakery_cupcakes`-, `bakery_cinnamon_buns`- ja `bakery_berry_tarts`-toimituksista. Toimintojen nimet, ohjeet ja määrät säilyvät, vaikka kuva ei lataudu.

Raaka-ainekuvien lähde on `nabby-v4-02-bakery-tools.zip`, ryhmä `bakery_ingredients`.

Uunin osien lähde on `nabby-v4-01-oven.zip`, ryhmä `oven`. Rungon mitat (582 × 614) sekä luukun, nupin, näytön ja ritilän ankkurit tulevat paketin `oven/assembly.json`-tiedostosta. Rungon vasemmasta yläkulmasta mitattuna luukku alkaa kohdasta (34, 267), nupin keskipiste on (190, 210), näyttö alkaa kohdasta (296, 180) ja ritilä kohdasta (85, 401). Luukun kehyksen vasemman reunan saranat on poistettu sekä atlasframesta että erilliskuvasta. Alareunan saranat piirretään CSS:llä. Paistovalo on aiemmasta leipomoatlaksesta.

Yhteiset [atlas-, puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Pelaa kaikki neljä reseptiä ja koko kymmenen tason tilauspolku, mukaan lukien pesun järjestys, paperi ennen annoksia, luukku ennen lämpöä ja oikea tavoitelämpö. Tarkista raaka-ainekuvat ja niiden näkyvät nimet sekä uunin näyttö, valo ja alareunan saranat auki ja kiinni. Tarkista myös atlaslatauksen varakuvat. Tarkista raahaus ja näppäimistö sekä poistuminen huuhtelun, paiston tai Phaser-latauksen aikana. [Seikkailutestit](../../tests/browser/baking-adventure.spec.js), [Pelitestit](../../tests/browser/expansion.spec.js), [eletestit](../../tests/browser/gestures.spec.js), [äänitestit](../../tests/browser/narration.spec.js)
