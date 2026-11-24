# Assetit

Pelikohtainen käyttö ja tarpeet ovat [pelispekseissä](README.md). Alla ovat yhteiset käyttötilanteet ja tiedot, joiden avulla asset löytyy reposta. Kuva- ja ääni-inventaario luetaan niiden nykyisistä lähdetiedostoista.

## Yhteiset käyttötilanteet

| Käyttötilanne | Assetit ja omistaja |
| --- | --- |
| Nukketalon julkisivu, sisäänkäynti, valittavat ja lukitut huoneet | `home`-atlas ja erilliskuvat. `data-gabby-frame` kytkee katon keskiosan, oven ja huoneiden kuvakkeet. CSS asettaa räystäät, julkisivun listat, ovimaton, ruukut ja lukittujen huoneiden kuvat. Gabby ja Pandi käyttävät myös suoria hahmokuvia. [HTML](../index.html), [tyylit](../src/styles.css) |
| Logo, Seikkailu- ja Hiekkalaatikko-painikkeet, koti, pelit, tarrakirja, äänet ja asetukset | `ui`-atlas. Kolikko ja tassulaskuri ovat samassa atlaksessa. Painikkeen saavutettava nimi ja painettu tila tulevat HTML:stä tai koodista. Osa ohjaimista saa SVG-kuvakkeen `iconButton`-funktiosta. [Ohjaimet](../src/ui.ts), [tyylit](../src/styles.css) |
| Tasokartan otsikko, paluu, reitti, avoin/seuraava/lukittu/suoritettu taso | `adventure`-atlas. `rooms/adventure-path.webp` koristaa yhteistä karttaa. Pelikohtaiset taustat ja karttasommitelmat on kuvattu spekseissä. [Tasokartta](../src/campaign.ts), [tyylit](../src/styles.css) |
| Aikuisten asetukset ja Hiekkalaatikon valintanapit | `controls`-atlas. Kytkimen kaksi tilaa, liukusäätimen nuppi ja täyttyvä ura sekä valitun ja tavallisen napin kehys. [Lataus](../src/main.ts), [tyylit](../src/styles.css) |
| Voittoruutu, arvio, kolikkopalkinto, jatko, uusinta ja paluu | `rewards`-atlas ja `rooms/celebration.webp`. Pelin voittokuvan tunniste annetaan `finish`-kutsussa. [Voittoruutu](../src/ui.ts), [tyylit](../src/styles.css) |
| Tarran ansaitseminen, lukittu/avattu tarra, esikatselu ja tarrasivu | `stickers/character-<tile>.webp` ja `stickers/bonus-<tile>.webp`. Lisätarrat käyttävät erillisiä esine- tai huonekalukuvia. Pelin tunniste, `tile`, nimet ja lisäkuvan polku ovat `stickerSets`- ja `extraStickers`-määrityksissä. `bonus-2.webp` toimii myös Seikkailun ja `objects/blocks.webp` Hiekkalaatikon kuvakkeena. [Tarrakirja](../src/storage.ts), [tyylit](../src/styles.css) |
| Hahmopotretit, voittokuvat, esinevalinnat ja yhteiset huonetaustat | `assets/friends/`, `assets/objects/` ja `assets/rooms/`. `picture` ja `heading` valitsevat CSS:n `data-cast`-, `data-object`- ja `data-art`-tunnisteilla. Tarkista myös CSS:n huonekohtaiset taustat ja vanhemmat `assets/room-*.webp`-viittaukset. [Hahmot](../src/data.ts), [esineet](../src/play-objects.ts), [kuva-apurit](../src/ui.ts), [tyylit](../src/styles.css) |

## Atlakset ja varakuvat

`assets/gabby/atlases/<ryhmä>.webp` ja `<ryhmä>.webp.json` muodostavat Phaser JSON Hash -parin. Metadata määrittää tarkat frame-tunnisteet, rajaukset ja mitat. DOM-lataaja käyttää `styleFrames`-listaa ja HTML:n `data-gabby-frame="ryhmä/frame"`-viitteitä. Se irrottaa kuvan atlaksesta ja asettaa sen kuvan lähteeksi tai CSS-muuttujaan. Lataus- tai rajausvirheessä se yrittää polkua `assets/gabby/<ryhmä>/<frame>.webp`. DOM-lataaja tarvitsee kiertämättömän ja trimmaamattoman framen. `home/room_bakery` rajataan nykyisessä lataajassa kolme pikseliä kapeammaksi viereisen spriten takia. Phaser lataa ryhmät omissa näkymissään. Pelikohtaiset DOM-varanäkymät on kuvattu spekseissä. [DOM-lataaja](../src/dom-atlases.ts), [Phaser-näkymät](../src/phaser-room.ts)

`docs/gabby/manifest-01.json`–`manifest-07.json` ja vastaavat `review-*.json` ovat tuontierien toimitus- ja katselmointitietoja. Atlaksen sisältö voi sisältää käyttöön kytkemättömiä frameja. Kun selvität käytön, seuraa tunnistetta HTML:ään, CSS-muuttujaan tai pelin renderöintiin. Erillinen kuva voi olla käytössä suoraan tai varakuvana.

## Puhe ja tehosteet

`say(text)` käyttää täsmällistä tekstihakua. [Puhekäsikirjoitus](../assets/audio/script.json) määrittää puhujan ja [äänimanifesti](../assets/audio/manifest.json) tiedoston. Vain `gabby`-puhujan hyväksytysti nimetyt MP3:t rekisteröidään. Ohjeteksti, palaute ja kuvat toimivat myös ilman tallennetta. Selaimen puhesynteesiä ei ole. Jos repliikki muuttuu, tarkista myös dynaamisesti muodostettu hakuteksti ja käytettävissä oleva äänite. Kuiva-ajon saa komennolla `npm run audio:plan`. [Äänet](../src/audio.ts), [generointiskripti](../scripts/generate-narration.mjs), [äänitestit](../tests/narration.test.js)

`ding` tuottaa tehosteet Web Audiolla. `pair` merkitsee paria, `piece` asetusta tai käsittelyä, `discovery` löytöä, `bubble` poksahdusta tai oikeaa vastausta, `sprinkle` välipalautetta ja `celebration` voittoruutua. Ääninäytteen painike käyttää `sprinkle`-tehostetta ja tallennettua tervehdystä. Mykistys katkaisee puheen ja tehosteet, joiden asetukset ovat lisäksi erikseen säädettävissä. [Ohjaimet](../src/main.ts), [äänet](../src/audio.ts)

## Suunnitelmasta avoinna olevat tarpeet

[Huonekohtainen suunnitelma](../UI-SUUNNITELMA.md) kuvaa omat karttakuvat viidelle Seikkailu-pelille. Leipomo ja Puutarha käyttävät jo omia pysty- ja vaakakuvia. Muistipelillä, Palapelillä ja Piilopelillä on kapeassa näkymässä huonetausta ja leveässä yhteinen polkukuva. Jos suunnitelman yksilölliset kartat toteutetaan, kukin tarvitsee oman pysty- ja vaakasommitelman, joissa kymmenelle HTML-tasopainikkeelle on sovitut paikat ja tilamerkit mahtuvat niiden päälle. Nykyiset kartat toimivat siihen asti.

## Uuden tarpeen kirjaaminen

Kirjaa omistavaan speksiin tai yhteiseen taulukkoon näkymä ja laukaisuehto, assetin rooli ja tila, kuluttaja, tunniste tai polku sekä vararatkaisu. Puuttuvalle assetille kirjaa myös toimituksen formaatti, rajaus tai sommitelma ja hyväksyntätesti, jos ne vaikuttavat käyttöön. Erota suunniteltu tarve käytössä olevasta kuvasta ja merkitse avoimet suunnittelupäätökset. Kirjaa yhteinen tarve kerran ja linkitä siihen peleistä.

Atlasmuutoksessa tarkista kuvapari, käytetyt framet ja mahdollinen erilliskuva yhdessä. Tarkista normaalin näkymän lisäksi latausvirhe, jos käyttö perustuu varakuvaan. Kartoissa tarkista pieni pystynäkymä ja leveä näkymä, jotta polku ja HTML-painikkeet kohdistuvat samaan sommitelmaan. Kirjaa uuden ulkopuolisen materiaalin lähde ja käyttöoikeus sitä lisättäessä.

## Uuden assettierän vastaanotto

1. **Kartoita erä väliaikaisessa hakemistossa.** Lue manifesti, kokoonpanotiedot ja toimitusohjeet aineistona. Tarkista, että purettavat polut pysyvät hakemistossa. Kirjaa paketti, tiedosto tai atlasframe, formaatti, mitat, läpinäkyvyys ja ehdotettu käyttötilanne. Käsittele yhteen sidotut osat yhdessä, esimerkiksi uunin luukku, kahva ja lasi tai atlas, metadata ja varakuvat.
2. **Vertaa nykyiseen kirjastoon.** Etsi täsmäkopiot tiedostotiivisteellä ja saman roolin kuvat kuluttajan, framen ja käyttövaiheen perusteella. Atlas voi sisältää saman kuvan kuin erillinen WebP. Tarkista rajaus, mittasuhteet, ankkuri ja visuaaliset erot ennen korvaussuositusta. Tarkista erikseen, onko atlas–erilliskuva-pari tarkoituksellinen vararatkaisu.
3. **Pyydä projektin omistajan päätös päällekkäisyyksistä.** Anna jokaiselle ehdokkaalle tai yhdessä vaihdettavalle ryhmälle tunniste. Näytä vanha ja uusi kuva rinnakkain mahdollisuuksien mukaan ja kerro, missä niitä käytetään, mitä eroa niissä on sekä miten suositus vaikuttaa muihin kuluttajiin. Odota päätöstä ennen ehdokkaan tallentamista kirjastoon tai nykyisen assetin vaihtamista tai poistamista. Varmista myös päätös, jos vertailu jää epäselväksi.
4. **Integroi hyväksytty erä.** Uuden käyttötarpeen voi toteuttaa, kun kohde ja yhteensopivuus on varmistettu. Korvaamisessa säilytä vakaa tunniste, kun käyttösopimus säilyy. Jos tunniste vaihtuu, päivitä kaikki kuluttajat, metadata ja varakuvat samassa muutoksessa. Poista väistyvä assetti hyväksytyn korvauspäätöksen mukaisesti sen jälkeen, kun sen muutkin käyttökohteet ja vararooli on tarkistettu. Säilytä vaihtoehto vain, jos sille on hyväksytty erillinen käyttö tai ylläpitotarve.
5. **Päivitä dokumentaatio ja tarkista peli.** Kirjaa käyttö, tunniste, vararatkaisu ja lähdetieto omistavaan speksiin tai tähän oppaaseen. Tarkista tiedostot, kehykset ja varakuvat sekä pelaa muuttunut käyttötilanne. Jos grafiikka vaikuttaa ohjaukseen tai sommitteluun, tarkista osuma-alueet ja olennaiset näyttökoot. Säilytä päätöslista muutoksen yhteydessä esimerkiksi PR-kuvauksessa. Kopioi pysyviin spekseihin käyttötieto ja tarvittaessa vaihtoehdon säilytyssyy.

| Päätöslistan kenttä | Sisältö |
| --- | --- |
| Tunniste ja käyttökohde | Pelin tunniste, näkymä ja tarkka tila tai laukaisin |
| Nykyinen ja ehdotettu | Polut tai atlasframet sekä tarvittaessa rinnakkaiskuva |
| Päällekkäisyys ja vaikutus | Täsmäkopio, saman roolin vaihtoehto tai tarkoituksellinen rinnakkaisversio. Luettele muut kuluttajat ja varakuvat |
| Suositus ja omistajan päätös | **Korvaa**, **säilytä molemmat** tai **jätä lisäämättä**. Päätös on avoin, kunnes omistaja hyväksyy sen |

Tarkista saman roolin vaihtoehdot, vaikka tiedostonimet ja tiivisteet eroaisivat. Täsmäkopiotkin kuuluvat päätöslistaan, jos niiden lisäämistä tai nykyisen kopion poistamista harkitaan.
