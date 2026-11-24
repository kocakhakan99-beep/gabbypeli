# Leipomon kehityssuunnitelma

Suunnitelma perustuu viiteen V5-assettiin, toimitettuun `CODEX-PROMPT.md`-tiedostoon ja [nykyiseen leipomospeksiin](baking.md). Kaikki neljä reseptiä ja uusi pesuasema kuuluvat uudistettuun Seikkailuun. Hiekkalaatikossa kaikki neljä reseptiä voi valita vapaasti. Kaikki kymmenen tilausta ja neljä reseptiä ovat käytössä. [Pelispeksi](baking.md) kuvaa toteutuksen, ja alla on suunnitteluperusteet.

## Seikkailun tilaukset

Jokainen taso alkaa Hileen tilauksella, joka näyttää leivonnaisen, määrän ja mahdollisen koristelutoiveen. Pelaaja valmistaa tilauksen ja näkee lopuksi oman valintansa tulosruudulla. Ensimmäinen taso opettaa pesun. Sen jälkeen pesu tehdään kerran leipomon pelikerralla, myös silloin kun ensimmäiseksi avataan myöhempi taso. Pesutila säilyy saman kartalta jatkuvan pelikerran aikana. Se nollataan, kun leipomosta poistutaan nukketaloon tai sivu ladataan uudelleen. Tason 1 voi aina pelata opastuksineen uudelleen.

| Taso | Tilaus | Uusi taito tai valinta |
| --- | --- | --- |
| 1 | 2 kissapiparia | Pese ja kuivaa kädet opastetusti. Kauli valmiiksi sekoitettu taikina, paina kaksi muotoa ja paista. |
| 2 | 3 kissapiparia | Lisää ainekset, sekoita ja koristele paistetut piparit valitsemallasi koristeella. |
| 3 | 2 kuppikakkua | Vuoraa pelti, täytä vuoat ja paista. Leikki tarjoaa valmiin taikinan ensimmäiseen vuoraharjoitukseen. |
| 4 | 3 kuppikakkua | Sekoita taikina, täytä vuoat ja lisää paiston jälkeen kuorrute sekä yksi marja- tai strösselivalinta. |
| 5 | 2 korvapuustia | Kauli valmis taikina suorakaiteeksi, levitä täyte, rullaa, leikkaa ja paista. |
| 6 | 3 korvapuustia | Sekoita taikina, muotoile, anna pullien kohota etenemisanimaation ajan, paista ja kuorruta. |
| 7 | 1 marjatorttu | Painele valmis taikina vuokaan, paista pohja, täytä ja lisää marjoja. |
| 8 | 1 marjatorttu kahdella täytteellä tai koristeella | Tee pohja itse ja valitse kaksi erilaista marjaa tai hedelmää. Näytä leikattu pala, jos valitulle tortulle on vastaava kuva. |
| 9 | 4 kuppikakkua | Tee koko resepti. Tilauksessa näkyy yksi toivottu koriste, ja pelaaja valitsee loput. |
| 10 | Hileen juhlatilaus | Valitse yksi neljästä reseptistä ja tee sen kaikki työvaiheet. Tulosruutu näyttää valitun reseptin ja koristeet. |

Tasot 1, 3, 5 ja 7 opettavat uuden työkalun vähillä kohteilla, ja seuraava taso laajentaa työnkulkua. Vaikeus kasvaa työvaiheiden ja valintojen kautta. Ensimmäinen väärä sijoitus palauttaa esineen ja kertoo sopivan kohteen. Toistuva yritys korostaa kohteen. Kosketuksen vaihtoehtona on painikkeen valinta ja kohdistetun toimen vahvistus. Paistossa käytetään nykyisen uunin avaus-, pellinsiirto-, sulku- ja lämpövaihetta. Tavoitelämpö kuuluu reseptiin. Paisto, kohotus ja jäähdytys etenevät automaattisesti, kun niiden edellytykset täyttyvät.

## Pelilogiikka ja assettien tilat

- **Tilaus ohjaa etenemistä.** Tasomääritys kertoo reseptin, annosmäärän, käytettävät vaiheet ja mahdollisen koristeluehdon. Hiekkalaatikko käyttää samoja vaiheita reseptin valinnan jälkeen. Tilaus ja suoritettu määrä näkyvät DOM-tekstinä.
- **Kukin vaihe muuttaa yhtä näkyvää asiaa.** Pesu muuttaa kädet kuivista saippuaisiksi, huuhdelluiksi ja pyyhekuiviksi. Piparit etenevät levystä muoteiksi ja paistetuiksi. Kuppikakkujen vuoat muuttuvat tyhjistä täytetyiksi ja paistetuiksi. Korvapuustien levy muuttuu rullaksi, viipaleiksi ja kohonneiksi pulliksi. Marjatortun vuoka muuttuu kuoreksi, täytetyksi tortuksi ja koristelluksi annokseksi. Jokaisella tilalla on oma kuva tai dokumentoitu DOM-varanäkymä.
- **Eteneminen perustuu tehtyihin toimintoihin.** Vaihe valmistuu, kun kaikki sen annokset tai työtoimet on kirjattu kerran. Pelin tila määrää, mitä piirretään ja mihin voi osua. Ryhmiteltyjä `stage_*`-kuvia käytetään tilausten ja ohjeiden kuvituksena. Tulos kokoaa toteutetun reseptin ja pelaajan valitsemat koristeet erillisistä osista.
- **Yhteinen käyttöliittymä pysyy kevyenä.** Ainesosien siirto, sekoitus, paisto, palautteet ja saavutettavat ohjaimet jaetaan. Reseptikohtaiset vaiheet käyttävät omia atlasframejaan. Käyttöön otetut V5-kuvat ladataan erillisinä WebP-kuvina silloin, kun ne näkyvät tilauksessa, työvaiheessa tai tuloksessa. Pelistä poistuminen purkaa aktiiviset eleet, Phaser-näkymän ja ajastimet.
- **Tallennus säilyy.** Käytä edelleen leipomon tasotunnisteita 1–10 ja avainta `gabbypeli-campaign-baking-v1`. Aiemmin suoritetut tasot pysyvät suorittuina ja uusittavina. Keskeneräinen tilaus alkaa alusta. Uuden tason ensimmäinen suoritus antaa nykyiset 25 kisukolikkoa. Uusinnat ja Hiekkalaatikko käyttävät nykyistä palkintologiikkaa.

## Toteutusjärjestys ja hyväksyntä

1. Tarkista Seikkailuun tarvittavat framet ja korjaa katselmuksessa havaitut rajaukset. Hyväksytä nykyisten pesuassettien korvaajat sekä yhteiset ainesosa-, työkalu- ja koristepäällekkäisyydet [vastaanotto-ohjeen](../assets.md#uuden-assettierän-vastaanotto) mukaan.
2. Toteuta Seikkailun tasomääritykset, uusi pesu ja kaksi ensimmäistä reseptiä. Testaa tasot 1–4 ja varmista, että tasolle 5 jatkava vanha tallennus aukeaa oikein.
3. Kytke korvapuustit ja marjatortut suoraan tasoihin 5–8 sekä reseptivalinta ja vaativammat tilaukset tasoihin 9–10. Julkaise uudistettu Seikkailupolku kokonaisena, kun kaikki kymmenen tasoa ovat pelattavissa.
4. Pelaa koko polku puhtaalla tallennuksella ja avaa vanhat tallennukset arvoilla 4, 7 ja 10. Tarkista 320 px:n näkymä, kosketus ja näppäimistö, kartalle paluu, reseptivalinnan neljä vaihtoehtoa, atlasvirheen varanäkymä ja poistuminen kesken paiston. Tarkista myös paistotuloksen valinnat, kerran maksettavat palkinnot ja kaikkien kymmenen tasopainikkeen tila. [Selaintestit](../../tests/browser/expansion.spec.js), [eletestit](../../tests/browser/gestures.spec.js)

## V5-erän katselmus

Katselmuksen alkuperäiset ehdotukset ovat alla. Nykyinen käyttö perustuu reseptikohtaisiin lähdesetteihin [leipomospeksin](baking.md#assetit-ja-käyttötilanteet) mukaisesti.

Kaikki viisi ZIP-pakettia ja manifestin 219 framea tarkistettiin. ZIP-tiedostot avautuvat ja framejen koordinaatit pysyvät atlasrajoissa. Tämä tarkistus ei vielä varmista kuvien semanttista rajausta.

| Päätös | Nykyinen ja ehdotettu käyttö | Suositus |
| --- | --- | --- |
| A · Pesuasema | Nykyiset `furniture/soap.webp`, `furniture/tap.webp` sekä CSS- ja Phaser-tilat. V5 tarjoaa `soap_pump`, `faucet_*`, `hands_*` ja `water_*`. | Hyväksy pesuasema yhtenä korvauskokonaisuutena, kun työvaiheilla on osumakohteet ja lähdeatlas on korjattu. Nykyiset kuvat voivat palvella muita näkymiä. |
| B · Yhteiset työkalut | Nykyiset ainesosat, kulhosarja, lusikka, pelti ja leivinpaperi. Useissa paketeissa on saman roolin `milk_bottle`, `flour_bag`, `egg`, `mixing_bowl`, `whisk`, `baking_tray` ja `parchment_paper`. | Säilytä nykyinen yhteinen sarja. Reseptikohtaiset astiat voivat tulla käyttöön, kun niillä on oma toiminto, esimerkiksi kuppikakkuvuoka. |
| C · Kuorrutteet, marjat ja koristeet | Nykyisen leipomoatlaksen kuorrutteet, mansikka ja vuoat sekä V5:n useat marja-, vuoka-, kuorrute- ja efektiversiot. | Valitse yksi jaettu perussarja koristeluvaiheen toteutuksen yhteydessä. Säilytä reseptikohtainen versio, kun se ilmaisee eri valinnan tai työvaiheen. |
| D · Piparimuotin päällekkäisyys | `bakery_cat_cookies/star_cookie_cutter` ja `cat_dough_cutout` sisältävät pikselitasolla saman kissataikinapalan. `cat_cookie_cutter`-rajauksessa näkyy myös tähtimuotti. | Käytä kissataikinalle `cat_dough_cutout`. Pyydä erikseen rajatut muotit ennen muotoiluvaihetta. |

Tarkistettavia rajauksia ovat ainakin pesuaseman `faucet_spout` ja `soap_pump`, kuppikakun `stage_baked_cupcakes` ja `plain_cupcake_purple`, korvapuustin `rolled_dough_rectangle` sekä marjatortun `tart_pan_purple`, `tart_shell_raw`, `tart_shell_baked` ja `tart_finished_mixed`. Kuvissa näkyy viereistä sisältöä, väärä kohde tai puutteellinen rajaus. Älä kytke näitä frameja ennen korjattua metadataa.

Toteutus käyttää alkuperäisistä V5-arkeista eristettyjä kuvia, mukaan lukien kissamuotti, korvapuustilevy ja torttuvuoan vaiheet. Kokonaista lähdeatlasta ei kopioida peliin. Hanan ja saippuan alkuperäisiä assetteja käytetään edelleen. Kuppikakun väärin nimetyt valmiin pellin kuvat ja piparipaketin tunnisteiden täsmäkopiot jäivät käyttövalikoiman ulkopuolelle. Käytetyt kuvat ja niiden roolit on kirjattu [pelispeksiin](baking.md).
