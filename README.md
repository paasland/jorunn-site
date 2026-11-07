# Jorunn-siden

Privat nettside på GitHub Pages. Koden er offentlig, bildene er det ikke: de ligger komprimert i Firestore og kan bare leses av innloggede, godkjente brukere.

## Oppsett (én gang)
1. **Firebase**: opprett prosjekt (Spark/gratis). Aktiver *Authentication → E-post/passord* og *Firestore* (region europe-west).
2. Lim web-config inn i `js/firebase.js`. Legg GitHub Pages-domenet (`<bruker>.github.io`) under *Authentication → Settings → Authorized domains*.
3. Publiser reglene: `npx firebase-tools deploy --only firestore:rules`.
4. **Servicekonto**: Prosjektinnstillinger → Servicekontoer → Generer ny nøkkel → lagre som `serviceAccount.json` i repo-roten (er gitignored, aldri commit den).
5. `cd tools && npm install`
6. Opprett kontoer (brukernavn/passord, ingen e-post):
   - `node create-user.js jorunn <passord>`
   - `node create-user.js per <passord> --admin`
7. Legg bilder og `manifest.json` i `content/` (gitignored), kjør `node upload-images.js`.
8. **GitHub**: push, deretter Settings → Pages → Deploy from branch `main` / root.

## Tagger
`face-self` (Jorunns ansikt), `face-opp` (motstanderes ansikter), `card` (kabal/billedlotto/puslespill), `world` (verdenshendelser på tidslinjen, vises ikke i album).

## Lokal test
`npx serve .` i repo-roten.
