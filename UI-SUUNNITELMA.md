# Huonekohtainen Seikkailu ja käyttöliittymän uudistus

## Pelipolku

Seikkailun valinta jättää nukketalon näkyviin. Huoneen valinta avaa kyseisen leikin oman tasokartan. Hiekkalaatikossa sama huone avaa vapaan leikin. Kartalta palataan nukketaloon Seikkailu valittuna ja kohdistus palautetaan huoneeseen. Tason jälkeen voi jatkaa seuraavalle tasolle, pelata uudelleen tai palata saman huoneen kartalle.

Kukin peli säilyttää oman etenemisensä. Ensimmäinen tasosuoritus antaa 25 kisukolikkoa. Uusintasuoritus ja Hiekkalaatikko eivät anna kolikoita. Nykyiset tarrat ja tallennukset säilytetään.

## Visuaalinen toteutus

Kodin julkisivu suunnitellaan yhtenäiseksi kokonaisuudeksi. Katto, seinät, kerroslistat, kivijalka ja hissitorni jakavat perspektiivin ja valaistuksen. Huoneiden taustat, esineet ja hahmot ovat erillisiä kuvia huoneaukkojen sisällä. Leveällä näytöllä huoneita on kolme rinnakkain ja puhelimella kaksi.

Jokaiselle viidelle leikille tehdään oma huonekohtainen karttakuva ja tasopolku. Aloitetaan Hileen leipomosta. Tasoille, otsikolle, sivunavigaatiolle ja etenemistiedoille varataan paikat jo kuvitusta suunniteltaessa. Puhelimelle tehdään pystysuuntainen vieritettävä polku. Suoritetut, seuraava ja lukitut tasot erottuvat kuvakkeilla ja väreillä.

Hiekkalaatikon asetukset tehdään pelikohtaisiksi ja suuriksi. Voittonäkymä näyttää oikeat kolikko- ja tarrapalkinnot sekä pelaa uudelleen, seuraava taso ja kartalle -toiminnot.

## Tekninen ratkaisu

TypeScript ja HTML/CSS toteuttavat navigoinnin, tallennukset, painikkeet ja saavutettavuuden. Phaser hoitaa minipelien piirron, animaation ja ohjauksen. Huoneiden taustat ovat WebP-kuvia ja hahmot sekä esineet erillisiä läpinäkyviä WebP- tai PNG-kuvia. Kartan SVG-polku ja HTML-tasopainikkeet käyttävät samaa koordinaatistoa. Pysty- ja vaakakuville käytetään tarvittaessa omia sommitelmia.

## Toteutusjärjestys

1. Korjaa pelipolku nukketalosta huonekohtaiseen karttaan ja takaisin.
2. Toteuta kokonainen Leipomon kartta, sen oma kuvitus ja vaaka- sekä pystysommitelma.
3. Toteuta muiden neljän leikin kartat samalla rakenteella, omilla huonekuvilla ja tasopaikoilla.
4. Yhtenäistä nukketalon julkisivu, Hiekkalaatikko ja voittonäkymä.
5. Vertaa selaimen kuvakaappauksia viitteisiin 320, 390 ja 1200 pikselin leveydellä. Pelaa Seikkailutaso palkintoon, jatka seuraavalle, palaa samalle kartalle sekä vaihda Hiekkalaatikkoon ja tarrakirjaan. Varmista myös, että uusintasuoritus ei anna uusia kolikoita.
