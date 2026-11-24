# Kisukeijun puutarha

`garden` · Seikkailu ja Hiekkalaatikko · [garden.ts](../../src/games/garden.ts)

## Pelisäännöt

Muokkaa multa, kastele ja siisti. Kunkin vaiheen kaikkien kasvupaikkojen mittarit täytetään ennen seuraavaa vaihetta. Pyyhkäisy voi osua useaan kasviin ja kukin paikka on myös tavallinen painike. Hiekkalaatikossa on kaksi penkkiä, joissa on kolme ja neljä paikkaa. Seikkailun tasoilla 1–5 on yksi penkki ja 6–10 kaksi. Paikkoja on tasoilla 1–2 kaksi, 3–7 kolme ja 8–10 enintään neljä, penkin paikkamäärän mukaan. Korkeammilla tasoilla yksi osuma kartuttaa mittaria vähemmän.

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

Tarkista vaiheenvaihto vasta kaikkien paikkojen valmistuttua, usean paikan pyyhkäisy, napit näppäimistöllä ja molemmat penkit. Tarkista tausta ja työkalut kapealla näytöllä sekä liikkeen vähennys. [Eletestit](../../tests/browser/gestures.spec.js), [visuaaliset testit](../../tests/browser/room-visuals.spec.js)
