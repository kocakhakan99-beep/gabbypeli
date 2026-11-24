# Kisukeijun puutarha V6

V6-toimituksessa on neljä uutta kuuden kuvan kasvusarjaa ja 77 V4:stä kierrätettyä yhteiskuvaa. Tarkistimme ZIP-eheyden, kasvureseptien ja manifestin framejärjestyksen sekä atlasrajat. Kasvusarjoissa ei löytynyt nykyisen puutarha-atlaksen pikselintarkkoja kopioita. Toimituksen `soil_dry`, `soil_wet`, `fence` ja `tulips` jakavat tunnisteet nykyisten kuvien kanssa, vaikka pikselit eroavat.

## Toteutusjärjestys

Kasvatuskokeilu ja kymmenen Seikkailutasoa on toteutettu [puutarhassa](garden.md). Kasvilöydöt ja koristetallennus kuuluvat seuraavaan vaiheeseen.

1. **Pelattava kasvatuskokeilu Hiekkalaatikossa.** Lisää nykyiseen Puutarhaan vapaaehtoinen yhden kasvupaikan polku. Kasvin valinta, kuohkeutus, kylvö, kastelu, hoito ja korjuu etenevät toiminnolla. Käytä valinnasta riippuen mansikan, auringonkukan, porkkanan tai kuvitteellisen taikakukan omaa atlasparia. Säilytä nykyinen tausta, työkalut ja Seikkailun tasot. Kokeilun tulos käyttää Hiekkalaatikon nykyisiä palkintosääntöjä.
2. **Seikkailun kasvatuspolku.** Resepteihin perustuva 10 tason polku. Tasot 1–4 opettavat kasvit yksi kerrallaan, 5–8 käyttävät kahta kasvupaikkaa, 9–10 kolmea. Yksi paikka on aktiivinen kerrallaan. Säilytä tasotunnisteet ja `gabbypeli-campaign-garden-v1` sekä ensimmäisen suorituksen palkintosäännöt. Tallenna keskeneräinen kasvatus vain, jos sitä myöhemmin tarvitaan.
3. **Löydöt ja koristeet.** Lisää versionoitu kasvilöytöjen ja paikkakohtaisten koristeiden tallennus. Koriste valitaan ansaitusta valikoimasta ja asetetaan sallittuun paikkaan. Erota kasvilöytö puutarhan tasopalkinnosta, jotta uusinta ei myönnä kolikoita uudelleen. Toteuta valinnat ja tallennus vasta, kun käytettävät koristeet on päätetty.

## Yhteisten assettien päätökset

Pidä nykyinen multa, lapio, kannu, roiske ja siivousgrafiikka. V6:n vaihtoehtoinen multa, kannut ja lapiot tarvitsevat omistajan korvauspäätöksen. Sama koskee aidan, tulppaanien ja yhteisten kasvukuvien versiota. [Vastaanotto-ohje](../assets.md#uuden-assettierän-vastaanotto)

Porkkanalla on oma irtosatokuva. Mansikan, auringonkukan ja taikakukan korjuu ilmaistaan kasvukuvan vaihdolla ja palautteella. Mahdolliset myöhemmät irtoassetit ovat mansikka, siemenet ja taikakukan terälehti. Kasvihuone, uusi puutarhatausta ja koristeet vaativat oman käyttötarpeen tai kuvatoimituksen.

## Tekniset testit

Lataa vain valitun kasvin WebP ja JSON suhteessa sivun URL-osoitteeseen. Phaser piirtää kuvan alakeskeltä ja käyttää samaa skaalausta kasvuvaiheissa. DOM vastaa toiminnallisista ohjaimista ja ohjetekstistä myös, jos kuva ei lataudu. Poistuminen purkaa näkymän ja eleet. Tarkista kaikki neljä kasvia, kapea näyttö, näppäimistö, väärä pudotus, kasvatus ilman kuvia ja käytön keskeytys. Seikkailun muuttuessa aja lisäksi aiempien tallennusten ja palkintojen testit.
