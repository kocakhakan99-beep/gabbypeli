# Gabbypelin kehitysohje

Aloita [dokumentaatiohakemistosta](docs/README.md) ja lue muutoksen kohteena olevan pelin speksi. Yhteisten näkymien ja assettien omistajat löytyvät samasta hakemistosta.

- Muokkaa TypeScriptiä ja CSS:ää hakemistossa `src/` sekä näkymien HTML:ää tiedostossa `index.html`. Generoi versioitu `app/` komennolla `npm run build` lähdekoodimuutoksen jälkeen.
- Arvioi dokumentaatiovaikutus jokaisessa koodimuutoksessa. Päivitä samassa muutoksessa speksi, kun pelisääntö, julkaisutila, ohjaus, eteneminen, tallennus, palaute tai käyttäjän näkemä tila muuttuu. Tarkista yhteisten toimintojen vaikutus kaikkiin niitä käyttäviin peleihin. Sisäinen refaktorointi voi päättyä pelkkään tarkistukseen.
- Päivitä assetin käyttötilanne sen omistavan pelin speksiin tai yhteiseen assettioppaaseen, kun assetin rooli, tila, tunniste, lataustapa tai vararatkaisu muuttuu. Kirjaa todettu puuttuva tarve samaan paikkaan ja siirrä se käytössä olevaksi, kun kuluttaja on kytketty.
- Käsittele uusi toimitus [assettierän vastaanotto-ohjeella](docs/assets.md#uuden-assettierän-vastaanotto). Pyydä projektin omistajan päätös saman roolin kuville ja muille päällekkäisyyksille ennen lisäämistä, korvaamista tai poistamista.
- Päivitä Seikkailun ja Hiekkalaatikon yhteiset reseptit, kasvatuspolut ja muut pelisisällöt samassa muutoksessa. Tarjoa Hiekkalaatikossa itsenäiset valinnat pelimuodolle ja olennaisille asetuksille.
- Toteuta uudet ja uudistettavat pelitoimet käsiteltävinä esineinä ja kohteina. Noudata [pelien uudistussuunnitelmaa](docs/gameplay-redesign.md), jossa kuvataan myös näppäimistöreitti, kerrokselliset kuvat ja molempien pelimuotojen testaus.
- Käytä leipomon aktiivisessa työvaiheessa ainoastaan sen oman lähdesetin kuvia. Hae reseptikuvat sen tunnisteella ja käytä kullekin setille omia kuvia myös ainesosissa ja työvälineissä. Katso [leipomospeksi](docs/games/baking.md#assetit-ja-käyttötilanteet).
- Käytä nykyistä testiä ja speksin hyväksyntätarkistuksia. Pelikäytöksen muutoksissa aja `npm test` ja kohdistettu Playwright-testi. Tarkista kosketus, näppäimistö, kapea näyttö tai varanäkymä, kun muutos vaikuttaa niihin.
- Kun pyydetty muutos on valmis ja tarvittavat tarkistukset läpäisevät, tee commit ja puske se GitHubin `main`-haaraan. Noudata tehtäväkohtaista kohdehaaraa tai julkaisurajoitusta, jos käyttäjä määrittää sellaisen.
