# Isot ja pienet

`sizes` · Piilotettu Hiekkalaatikon toteutus · [sizes.ts](../../src/games/sizes.ts)

## Pelisäännöt

Lajittele jokaisen lelun pieni ja iso versio oikeaan koriin. Raahaa tai valitse lelu ja sitten kori. Väärä kori antaa vihjeen ja lelu jää käyttöön. Oikeassa korissa lelu poistuu hyllystä ja näkyy korissa. Neljä kierrosta käyttävät järjestyksessä lankakerää, mansikkaa, venettä ja simpukkaa sekä palikoita ja junaa. Huonepainike on piilotettu.

## Assetit ja käyttötilanteet

| Käyttö | Assetti tai toteutus |
| --- | --- |
| Huone-esikatselu, otsikko ja voitto | Piilotetun huoneen pienet ja isot pallot piirretään CSS:llä, Pandi tulee `friends/pandy.webp`-kuvasta |
| Hylly, raahauskuva ja koriin laitettu lelu | Sama `objects/`-kuva kulkee kolmen tilan läpi. CSS skaalaa tavanomaisen kuvan pieneen tai isoon kokoon |
| Korit ja palaute | CSS-korit, väärän korin heilautus liikeasetuksen mukaan ja `piece` oikeassa korissa |

Yhteiset [kuva- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Jos huone palautetaan käyttöön, varmista molemmat koot kaikille leluille, väärän korin palaute, kosketusraahaus ja näppäimistövalinta. Tarkista, että raahauskuva poistuu eleen peruuntuessa.
