# Slack to MAXQDA Adapter

Työpöytäsovellus Slack-keskustelujen viemiseksi MAXQDA-yhteensopiviin muotoihin laadullista analyysiä varten.

## Ominaisuudet

- Vie Slack-kanavaviestit DOCX- tai Markdown-muotoon MAXQDA-analyysiä varten
- Käyttäjäystävällinen GUI, joka on rakennettu Electronilla ja Reactilla
- Monikielinen tuki (AI-käännös: englanti, japani, korea, suomi, kiina, perinteinen kiina, espanja, portugali, hollanti, ukraina)
- Slack-sovelluksen manifestin luonti helppoa asennusta varten
- Monialustatuki (Windows, macOS, Linux)

## Asennus

Lataa uusin julkaisu alustallesi [Releases](https://github.com/nae-lab/Slack-To-MAXQDA-Adaptor/releases) -sivulta.

## Kehitys

### Esivaatimukset

- Node.js 20 tai uudempi
- npm tai pnpm

### Asennus

```bash
# Kloonaa arkisto
git clone https://github.com/nae-lab/Slack-To-MAXQDA-Adaptor.git
cd Slack-To-MAXQDA-Adaptor

# Asenna riippuvuudet
npm install

# Käynnistä kehitystilassa
npm run electron:dev
```

### Rakentaminen

```bash
# Rakenna nykyiselle alustalle
npm run dist

# Rakenna tietylle alustalle
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

## Käyttö

1. Luo Slack-sovellus napsauttamalla "Klikkaa tästä nähdäksesi, miten Slack-sovellus luodaan" sovelluksessa
2. Kopioi annettu manifesti ja luo uusi Slack-sovellus
3. Asenna sovellus työtilaan ja kopioi Bot User OAuth Token
4. Syötä token sovellukseen
5. Anna kanavan ID ja päivämääräväli vientiä varten
6. Valitse tulostusmuoto ja sijainti
7. Napsauta Vie

## Lisenssi

MIT
