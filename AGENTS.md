# Gabbypelin kehitysohje

Aloita [dokumentaatiohakemistosta](docs/README.md) ja lue muutoksen kohteena olevan pelin speksi. Yhteisten näkymien ja assettien omistajat löytyvät samasta hakemistosta.

- Muokkaa TypeScriptiä ja CSS:ää hakemistossa `src/` sekä näkymien HTML:ää tiedostossa `index.html`. Generoi versioitu `app/` komennolla `npm run build` lähdekoodimuutoksen jälkeen.
- Arvioi dokumentaatiovaikutus jokaisessa koodimuutoksessa. Päivitä samassa muutoksessa speksi, kun pelisääntö, julkaisutila, ohjaus, eteneminen, tallennus, palaute tai käyttäjän näkemä tila muuttuu. Tarkista yhteisten toimintojen vaikutus kaikkiin niitä käyttäviin peleihin. Sisäinen refaktorointi voi päättyä pelkkään tarkistukseen.
- Päivitä assetin käyttötilanne sen omistavan pelin speksiin tai yhteiseen assettioppaaseen, kun assetin rooli, tila, tunniste, lataustapa tai vararatkaisu muuttuu. Kirjaa todettu puuttuva tarve samaan paikkaan ja siirrä se käytössä olevaksi, kun kuluttaja on kytketty.
- Käytä nykyistä testiä ja speksin hyväksyntätarkistuksia. Pelikäytöksen muutoksissa aja `npm test` ja kohdistettu Playwright-testi. Tarkista kosketus, näppäimistö, kapea näyttö tai varanäkymä, kun muutos vaikuttaa niihin.
