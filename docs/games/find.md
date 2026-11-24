# Kuka piilottelee?

`find` · Seikkailu ja Hiekkalaatikko · [find.ts](../../src/games/find.ts)

## Pelisäännöt

Tutki huonekaluja napauttamalla, painamalla näppäimistöllä tai vetämällä niitä sivuun. Yhdestä löytyy kaveri, muista huonekohtainen yllätys. Kaverin löytyessä muut paikat lukitaan ja peli tarjoaa seuraavan huoneen tai juhlan. Hiekkalaatikossa on kuusi huonetta ja neljä piiloa per huone. Seikkailussa huoneiden määrä kasvaa yhdestä kuuteen. Piiloja on tasoilla 1–2 kaksi, 3–5 kolme ja 6–10 neljä. Aloitushuone kiertää tasoittain.

## Assetit ja käyttötilanteet

| Käyttö | Assetti ja varanäkymä |
| --- | --- |
| Huonevalinta, kartta ja tausta | `home/room_hide`, kapealla kartalla `rooms/music.webp` ja leveällä yhteinen Seikkailupolku. Pelissä CSS valitsee huoneteeman kaverin mukaan |
| Tutkittava huonekalu | `roomObjects` valitsee kalusteet. `hideFrames` käyttää kaappiin, tuoliin, laatikkoon ja koriin `hide`-atlasta ja DOM-erilliskuvia. Muut esineet tulevat `furniture/`-hakemistosta |
| Kalusteen avaus ja paljastus | Phaser siirtää kalusteen pois hahmon tai esineen edestä. DOM-painike paljastaa saman sisällön. `roomSurprises` valitsee tähden, kuppikakut, simpukan, kastelukannun, lankakerän tai junan |
| Hahmo ja palaute | Potretti näyttää ensin Gabbyn ja sitten löydetyn hahmon. Yllätys käyttää `sprinkle`-tehostetta, kaveri `discovery`-tehostetta. Voittokuvana Gabby |

Yhteiset [atlas-, puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Tarkista napautus, veto ja näppäimistö, yllätyksen ja kaverin eri palaute, seuraava huone ja poistuminen kesken automaattisen siirtymän. [Phaser-testi](../../tests/browser/phaser-room.spec.js), [siirtymätesti](../../tests/browser/automatic.spec.js)
