# Cosa Mangiamo? — MVP per l'Italia

## Promessa

"Trova gli ingredienti cinesi vicino a te e trasformali in una cena che riesci davvero a fare." L'app e' in italiano; il cinese compare solo come aiuto per riconoscere ingredienti e piatti.

## Utente iniziale

Italiani che hanno salvato un video di cucina cinese, vogliono cucinarlo nel weekend e non sanno dove trovare gli ingredienti. La prima azione deve funzionare senza registrazione: consentire la posizione, scegliere un negozio, vedere cosa comprare.

## MVP: quattro aree

1. **Scopri** — geolocalizzazione, mappa/lista dei supermercati asiatici, ricerca per citta' o ingrediente.
2. **Negozio** — orari, indicazioni, affidabilita' della disponibilita', categorie e prodotti confermati dalla community o dal negozio.
3. **Ricette** — ogni ricetta mostra "ce l'hai / lo compri qui", lista della spesa, video verticale di LINXIA e passaggi; si salva senza account.
4. **Crea** — upload video della community, ricetta collegata e moderazione prima della pubblicazione.

## Navigazione e priorita'

L'azione primaria nella home e' "Trova un supermercato asiatico". La ricetta non e' un feed generico: arriva dopo che l'utente ha scelto un negozio o dichiarato la dispensa. Questo risolve il vero problema del pubblico e crea una ragione concreta per riaprire l'app.

## Design system

- Linguaggio: italiano naturale e rassicurante, senza presupporre conoscenza della cucina cinese.
- Look: premium caldo, verde giada `#203F36`, corallo `#E55C3D`, fondo riso `#FAF8F3`; pulito e conversion-oriented su mobile.
- Accessibilita': contrasto alto, testo minimo 12 pt, etichette oltre alle icone, nessuna informazione affidata solo al colore.
- Fiducia: ogni disponibilita' espone data e fonte: `Confermato dal negozio`, `Segnalato dalla community`, oppure `Da verificare`.

## Dati e verifica dei negozi

La prima fonte e' una directory editoriale iniziale: Google Places/OSM + verifica manuale. Un'attivita' non e' considerata "verificata" finche' non esiste contatto diretto o conferma recente. Per i prodotti: il gestore ha precedenza, poi tre segnalazioni community coerenti; i dati vecchi tornano a "Da verificare" dopo 30 giorni.

## Architettura

- App mobile: Expo / React Native, una codebase per iOS e Android.
- Mappe: Apple Maps su iOS e Google Maps su Android nel build di produzione; per il prototipo il layer e' rappresentato senza SDK proprietario.
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions) con lo schema incluso in `supabase/migrations`.
- Video: Storage + transcodifica/thumbnail in coda; solo contenuti in stato `published` entrano nel feed.
- Ricerca: Postgres full-text all'inizio; geospatial index/PostGIS quando il catalogo supera circa 5.000 negozi.

## Roadmap concreta

**Fase 0 — 2 settimane.** Nome/dominio, policy privacy, design definitivo, seed di 100 negozi in 5 citta' (Milano, Roma, Torino, Bologna, Firenze), 30 ricette LINXIA.

**Fase 1 — 4 settimane.** Mappa reale, pagina negozio, ingredienti/ricette, salvataggi locali, analytics (ricerca, indicazioni aperte, ricetta salvata).

**Fase 2 — 3 settimane.** Account, dispensa, lista spesa condivisibile, disponibilita' community e dashboard di verifica.

**Fase 3 — 4 settimane.** Upload video, consenso/diritti, coda moderazione, profili creator, notifiche su nuovi negozi e offerte.

## Prima metrica da ottimizzare

`utente con posizione → apre una scheda negozio → salva/apre una ricetta entro la stessa sessione`.

## Non fare nel primo rilascio

- Vendita o pagamento in-app: non controlliamo ancora stock e prezzi.
- Disponibilita' presentata come certa senza fonte/data.
- Feed video infinito che nasconde la funzione di scoperta negozi.
