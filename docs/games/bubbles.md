# Kuplataika

`bubbles` · Piilotettu Hiekkalaatikon toteutus · [bubbles.ts](../../src/games/bubbles.ts)

## Pelisäännöt

Etsi kaikki mallin mukaiset kuplat napauttamalla, pyyhkäisemällä tai näppäimistöllä. Neljän kierroksen tavoitteet ovat kaksi sinistä ympyrää, kolme vaaleanpunaista ympyrää, kaksi neliötä ja neljä sinistä ympyrää. Kullakin kierroksella on kaksi häiriökuplaa. Väärä kupla jää kentälle, oikea poksahtaa ja poistuu käytöstä. Huonepainike on piilotettu.

## Assetit ja käyttötilanteet

| Käyttö | Assetti tai toteutus |
| --- | --- |
| Huone-esikatselu ja pelin tausta | Piilotettu huone käyttää simpukkaa ja Merikattia. Kentän tausta käyttää `assets/room-bathroom.webp`-kuvaa. Merikatti on potretissa ja voittokuvassa |
| Tavoitemalli, tavallinen kupla ja poksahtanut kupla | CSS piirtää sinisen ympyrän, vaaleanpunaisen ympyrän ja neliön sekä poksahdustilan |
| Ohje ja palaute | Puhehaku dynaamiselle tavoite- ja lukumäärätekstille, väärälle osumalle ja kierroksen valmistumiselle. Oikea osuma käyttää `bubble`-tehostetta |

Yhteiset [puhe- ja palkintokäytännöt](../assets.md).

## Hyväksyntätarkistukset

Jos huone palautetaan käyttöön, tarkista kaikki tavoitteet, pyyhkäisy usean kuplan yli, saman osuman laskeminen kerran sekä väärän kuplan säilyminen. Tarkista tavoitteen tunnistaminen myös ohjetekstistä ja kuplien saavutettavista nimistä.
