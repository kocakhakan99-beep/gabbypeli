# Yhteinen pelialusta

| Muutoskohde | Lähde |
| --- | --- |
| Näkyvät ja piilotetut huoneet, paneelit, asetukset | [index.html](../index.html) |
| Valittu pelimuoto, tasokartalle meno, paluu ja asetusten tapahtumat | [main.ts](../src/main.ts) |
| Pelin avaus, ajastin, kohdistus ja siivous | [navigation.ts](../src/navigation.ts), [free-play-clock.ts](../src/free-play-clock.ts) |
| Tasot, kolikot ja eteneminen | [campaign.ts](../src/campaign.ts) |
| Otsikot, palaute, seuraava toiminto ja voittoruutu | [ui.ts](../src/ui.ts) |
| Tarrat, tarrasivu ja ääniasetukset | [storage.ts](../src/storage.ts) |
| DOM-painikkeet, Phaser-näkymät ja osoitinsilta | [phaser-room.ts](../src/phaser-room.ts), [stroke.ts](../src/games/stroke.ts) |

## Siirtymät ja eteneminen

- Seikkailun valinta jättää nukketalon näkyviin. Huone avaa oman 10 tason kartan. Ensimmäinen pelaamaton taso ja suoritetut tasot ovat valittavissa. Uusi taso antaa 25 kisukolikkoa ja kirjaa yhden suorituksen tarrapalkintoihin. Kolikkosaldo johdetaan kaikkien viiden pelin tasosuorituksista.
- Voittoruudussa voi pelata tason uudelleen, siirtyä seuraavalle tasolle (tasot 1–9) tai palata saman huoneen kartalle. Uusintasuoritus ei lisää palkintoja. Kartan paluu vie nukketaloon Seikkailu valittuna.
- Hiekkalaatikossa huone avautuu suoraan. Jos aikaraja on valittu, se koskee avattua peliä ja käynnistyy uudelleen pelin uudelleenkäynnistyksessä. Ajan päättyessä pelialue piilotetaan, eleet ja äänet pysäytetään ja kohdistus siirtyy päättymisotsikkoon. Vapaa peli ei kasvata kolikko- tai tarrakertymää.
- Pelinvaihto ja poistuminen katkaisevat automaattisen etenemisen, eleet ja äänet. Pelit, jotka kutsuvat `advanceAfterSuccess`, käynnistävät seuraavan toiminnon 3,5 sekunnin kuluttua, ellei pelaaja valitse sitä itse tai poistu.
- Interaktiiviset DOM-elementit kantavat näppäimistötoimintoja ja saavutettavia nimiä myös silloin, kun Phaser piirtää pelialueen. Säilytä kosketus- ja näppäimistöreitit sekä näkymien purku vaihdettaessa peliä tai pelin vaihetta.

## Tallennus

| Avain localStoragessa | Sisältö |
| --- | --- |
| `gabbypeli-campaign-<game>-v1` | Pelin korkein suoritettu taso välillä 0–10 |
| `gabbypeli-progress-v1` | Versioidut pelikohtaiset suoritukset ja ääniasetukset |
| `gabbypeli-sticker-page-v1` | Tarrakirjan sivulle asetetut tarrat ja niiden sijainnit |

Tallennuksen estyessä peli jatkuu muistissa. Tarrakirja näyttää yhdeksän pelin perus- ja bonustarrat sekä kuusi lisätarraa. Tarrat avautuvat kyseisen pelin ensimmäisellä, toisella ja mahdollisella kolmannella palkintoon oikeuttavalla suorituksella. Vanhojen tallennusten suoritukset näkyvät edelleen tarrakirjassa. Säilytä pelitunnisteiden, tallennusavainten ja tarratasojen yhteensopivuus.

Tarkista palkinnot, paluu ja uudelleenlataus [tarratestillä](../tests/browser/stickers.spec.js), kartta [mobiilitestillä](../tests/browser/mobile-adventure.spec.js) ja lähtö kesken automaattisen etenemisen [siirtymätestillä](../tests/browser/automatic.spec.js). [Yksikkötestit](../tests/core.test.js) kattavat tallennuksen validoinnin ja virhetilanteita.
