# Kisukeijun puutarha

`garden` · Seikkailu ja Hiekkalaatikko · [garden.ts](../../src/games/garden.ts)

[V6-katselmus ja toteutussuunnitelma](garden-v6.md)

## Seikkailun kasvatuspolku

| Tasot | Kasvupaikat |
| --- | --- |
| 1–4 | 1. Mansikka, 2. auringonkukka, 3. porkkana, 4. taikakukka |
| 5–8 | 5. mansikka ja porkkana, 6. auringonkukka ja taikakukka, 7. porkkana ja auringonkukka, 8. taikakukka ja mansikka |
| 9–10 | 9. mansikka, porkkana ja auringonkukka, 10. auringonkukka, porkkana ja taikakukka |

Tason kasvupaikat näkyvät järjestyksessä. Aktiivinen paikka on merkitty ja korjatut paikat saavat valmiin merkinnän. Yksi paikka käsitellään kerrallaan. Valmis sato siirretään koriin, jolloin seuraava kasvupaikka avautuu tai koko tilaus valmistuu. Tason eteneminen lasketaan korjatuista paikoista. Keskeytetty taso alkaa seuraavalla kerralla alusta. Aiemmat tasosuoritukset, kolikot ja tarrat säilyvät. Ensisuoritus antaa tavalliset 25 kisukolikkoa, ja uusintasuoritus ei lisää saldoa.

## Kasvatus Hiekkalaatikossa

Puutarha avautuu **Kasvata oma kasvi** -tilaan. Valitse 1–3 kasvupaikkaa ja niiden kasvit mansikasta, auringonkukasta, porkkanasta ja taikakukasta. Ensimmäisen kasvin painike käynnistää kasvatuksen. Valitse **Kukkapenkit**, jos haluat usean paikan pyyhkäisyleikin. Kuohkeuta multa, kylvä, kastele siemen ja itu, siisti kasvupaikka, kastele kasvi ja korjaa sato. Vedä työväline kasvupaikalle. Kastelukannu kallistuu kasvin päällä ja vesiroiske lakkaa eleen päättyessä. Vedä rikkaruoho sivuun, nosta kasvin sato ylös ja siirrä se satokoriin. Samoja esineitä voi käyttää näppäimistöllä. Väärä pudotus antaa vihjeen ja säilyttää vaiheen. Sadonkorjuu avaa juhlan nykyisillä Hiekkalaatikon palkintosäännöillä. Kasvatus alkaa alusta, kun huone avataan uudelleen.

Kasvikuvat tulevat `assets/nabby-garden-v6/<kasvi>/`-hakemiston WebP- ja JSON-pareista. Phaser lataa vain valitun kasvin. Siemenframen rajattu `seed.webp` on liikkuva kylvöesine. Siemen näkyy ennen kylvöä, kylvetty siemen piiloutuu multaan ja seuraavat kuvat vaihtuvat toiminnon mukaan. Korjuun jälkeen porkkanasta näkyy nostettu juuri, muista kasveista toimitettu korjuun jälkeinen tila. Työkalut käyttävät nykyisiä puutarha-assetteja, ja kasvupaikan multa sekä tekstit ovat DOMissa. [Kasvatuslogiikka](../../src/games/garden-crops.ts), [kasvatustestit](../../tests/browser/garden-crops.spec.js)

## Hiekkalaatikon kukkapenkit

Muokkaa multa, kastele ja siisti. Kunkin vaiheen kaikkien kasvupaikkojen mittarit täytetään ennen seuraavaa vaihetta. Pyyhkäisy voi osua useaan kasviin ja kukin paikka on myös tavallinen painike. Hiekkalaatikossa on kaksi penkkiä, joissa on kolme ja neljä paikkaa.

## Assetit ja käyttötilanteet

| Käyttö | Assetti ja varanäkymä |
| --- | --- |
| Huonevalinta, kartta ja pelitila | `home/room_garden`, kartan pysty- ja vaakakuva `rooms/garden-map-tall.webp` ja `garden-map-wide.webp`. Kentällä `menu/garden-backdrop.webp`, huoneteemassa myös `rooms/garden.webp` ja `room-garden.webp`. Kisukeiju potretissa ja voittokuvassa |
| Kuiva, muokattu ja kasteltu maa | `garden`-atlaksen `soil_dry`, `soil_loose`, `soil_wet`. DOM-varanäkymä piirtää mullan CSS:llä |
| Taimi, kasvu ja kukkiva kasvi | `seedling`, `flower_bloom`, `flower_full`. DOMissa varsi, nuppu ja terälehdet |
| Siivottavat kohteet ja työkalut | `weed_clover` ja `stone_small` häipyvät siivouksen edetessä. DOM käyttää lapio-, kastelukannu-, roiske- ja lehtiframeja `garden`-ryhmästä |
| Valmis kasvupaikka | Mittari ja tähtirivi antavat näkyvän palautteen, `sprinkle` äänen |

Yhteiset [atlas-, puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Tarkista Seikkailun kaikki tilaukset, seuraava kasvupaikka, keskeytys, vanha eteneminen ja ensisuorituksen palkinto. Tarkista Hiekkalaatikon molemmat kukkapenkit, usean paikan pyyhkäisy ja näppäimistöohjaus. Tarkista tausta ja työkalut kapealla näytöllä sekä liikkeen vähennys. [Eletestit](../../tests/browser/gestures.spec.js), [visuaaliset testit](../../tests/browser/room-visuals.spec.js)
