# Cosa Mangiamo?

Prototipo mobile di un'app italiana per trovare supermercati asiatici, ingredienti cinesi e ricette/video collegati.

## Avvio

```bash
npm install
npx expo start
```

Per il prototipo, la mappa e i dati dei negozi sono locali in `src/data.ts`. Il pulsante della posizione richiede il consenso reale del dispositivo; non invia coordinate a un server.

## Produzione

1. Creare un progetto Supabase e applicare `supabase/migrations/001_initial_schema.sql`.
2. Aggiungere una directory iniziale verificata di negozi e prodotti.
3. Collegare Apple Maps (iOS) e Google Maps (Android) nel development build di Expo, quindi attivare i marker dal database.
4. Configurare Storage e moderazione prima di attivare l'upload pubblico.

La cartella `PRODUCT.md` contiene UX, priorita' prodotto e roadmap.
