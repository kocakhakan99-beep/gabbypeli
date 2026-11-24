# Kotinäkymän kuvitus ja tarkistuslista

Koti käyttää repon kattoa, puutarhataustaa, huonekuvia ja hahmoja. Huoneet ovat HTML-painikkeita, joten sama näkymä toimii kosketuksella ja näppäimistöllä. Puhelimella huoneet ovat kahdessa sarakkeessa. Leveällä näytöllä niitä on kolme rinnakkain ja navigaatio on pelitilan valinnan vieressä.

## Kuvituksen hyväksyntä

- Käytä ensin nykyisiä kuvia, jos ne sopivat sommitteluun ja käyttökokoon.
- Hyväksy uusi kuvitus kuvakaappauksesta todellisessa käyttökoossa. Tarkista terävyys, läpinäkyvät reunat, rajaus ja sopivuus viereisiin kuviin.
- Julkaise sprite vasta, kun sen kaikki ruudut ovat valmiit. Tarkista animaation kohdistus ja nykiminen pelissä. Käytä staattista kuvaa, jos se toimii yhtä hyvin.
- Tarkista ennen vanhan kuvan poistamista myös TypeScriptissä muodostetut polut ja Phaserin lataamat kuvat.

## Julkaisun tarkistuslista

- [ ] Vertaa 320, 390 ja 1200 pikselin kuvakaappauksia referenssiin. Tarkista huoneiden järjestys, nimet, rajaus ja koko sivun ylivuoto.
- [ ] Avaa kaikki kuusi huonetta. Tarkista paluu, tilanvaihto ja tarrakirja. Varmista, että näppäimistöllä näkee kohdistuksen.
- [ ] Aja `npm run typecheck`, `npm test` ja `npm run test:browser`.
- [ ] Tarkista oikealla iPhonella Safarin kosketus, vieritys ja ääni. Tarkista myös kotinäytöltä avaaminen, jos julkaisu sisältää sen tuen.
