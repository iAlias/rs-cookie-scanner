# Cookie Scanner

Una semplice applicazione web per analizzare i cookie dei siti web e classificarli per la conformità GDPR. **Versione semplificata senza backend** - funziona completamente nel browser!

## ✨ Caratteristiche

- **Nessun backend richiesto**: Applicazione statica HTML che funziona direttamente nel browser
- **Scansione cookie correnti**: Analizza i cookie della pagina corrente
- **Bookmarklet**: Usa il bookmarklet per analizzare i cookie di qualsiasi sito
- **Classificazione automatica**: Cookie noti (Google Analytics, Facebook Pixel, ecc.) vengono classificati automaticamente
- **Modifica manuale**: Modifica categoria, provider e descrizione per ogni cookie inline
- **Esportazione JSON**: Esporta il catalogo completo dei cookie come file JSON
- **UI Responsiva**: Funziona su desktop, tablet e mobile
- **Rilevamento First/Third party**: Classifica automaticamente i cookie come first-party o third-party

## 🚀 Avvio Rapido

### Versione Semplice (Senza Backend) - **CONSIGLIATA**

Apri semplicemente il file `index.html` nel tuo browser:

```bash
# Apri direttamente nel browser
open index.html
# oppure
firefox index.html
# oppure
chrome index.html
```

Oppure ospitalo su qualsiasi server web statico:
```bash
# Con Python
python3 -m http.server 8000

# Con Node.js
npx serve .

# Poi apri http://localhost:8000
```

### Versione Completa con Backend (Opzionale)

Se hai bisogno della scansione automatica con Playwright:

#### Prerequisiti

- Node.js 18+
- npm

#### Installazione

```bash
# Installa le dipendenze del server
npm install

# Installa il browser Playwright
npx playwright install chromium

# Installa le dipendenze del client
cd client && npm install && cd ..
```

#### Sviluppo

```bash
# Esegui server e client in modalità dev
npm run dev
```

- Server su `http://localhost:3001`
- Client su `http://localhost:5173` (con proxy al server)

#### Produzione

```bash
# Compila il client
npm run build

# Avvia il server (serve il build del client)
npm start
```

#### Docker

```bash
docker build -t cookie-scanner .
docker run -p 3001:3001 cookie-scanner
```

## 📖 Utilizzo

### Versione Semplice (Senza Backend)

1. Apri `index.html` nel browser
2. Hai due opzioni:
   - **Scansiona pagina corrente**: Clicca "Scansiona Cookie Correnti" per vedere i cookie del dominio corrente
   - **Usa bookmarklet**: Trascina il bookmarklet nei preferiti e usalo su qualsiasi sito web
3. Visualizza la tabella dei risultati con tutti i cookie rilevati
4. Modifica categorie, provider e descrizioni secondo necessità
5. Clicca **Esporta JSON** per scaricare il catalogo dei cookie

### Versione con Backend (Opzionale)

1. Apri l'applicazione nel browser
2. Inserisci un dominio/URL (es. `https://example.com`)
3. Opzionalmente aggiungi URL aggiuntivi da scansionare (uno per riga, max 10)
4. Regola il tempo di attesa se necessario (default: 3000ms)
5. Clicca **Start Scan**
6. Visualizza la tabella dei risultati
7. Modifica secondo necessità
8. Clicca **Export JSON** per scaricare

## API Endpoints (Solo Versione con Backend)

**Nota**: Questi endpoint sono disponibili solo se usi la versione completa con backend. La versione semplice `index.html` non li richiede.

### POST /api/scan

Start a cookie scan.

**Request body:**
```json
{
  "url": "https://example.com",
  "additionalUrls": "https://example.com/about\nhttps://example.com/contact",
  "waitTime": 3000
}
```

**Response:**
```json
{
  "id": "scan-id",
  "domain": "example.com",
  "scanDate": "2024-01-01T00:00:00.000Z",
  "cookies": [...]
}
```

### GET /api/scan/:id

Retrieve a scan result by ID.

### PUT /api/scan/:id/cookie

Update cookie metadata (category, provider, description).

**Request body:**
```json
{
  "name": "_ga",
  "domain": ".example.com",
  "category": "analytics",
  "provider": "Google",
  "description": "Used to distinguish users"
}
```

## 📝 Formato Esportazione

Il file JSON esportato contiene tutte le informazioni sui cookie scansionati:

```json
{
  "domain": "example.com",
  "scanDate": "2024-01-01T00:00:00.000Z",
  "cookies": [
    {
      "name": "_ga",
      "domain": ".example.com",
      "category": "analytics",
      "provider": "Google",
      "description": "Used to distinguish users",
      "httpOnly": false,
      "secure": true,
      "sameSite": "Lax",
      "expires": 1780000000
    }
  ]
}
```

## 🛠️ Stack Tecnologico

### Versione Semplice (Senza Backend)
- **Frontend**: HTML, CSS, JavaScript Vanilla
- **Nessuna dipendenza**: Funziona out-of-the-box
- **Static hosting**: Può essere ospitato su qualsiasi server web statico

### Versione Completa (Con Backend)
- **Backend**: Node.js, Express
- **Scanner**: Playwright (Chromium)
- **Frontend**: React, Vite
- **Styling**: Vanilla CSS
- **Containerization**: Docker

## 📊 Categorie Cookie

| Categoria | Descrizione |
|---|---|
| necessary | Essenziali per il funzionamento del sito |
| analytics | Usati per analisi e statistiche del sito |
| marketing | Usati per pubblicità e tracciamento |
| preferences | Memorizzano le preferenze utente |
| unknown | Non ancora classificati |

## 🔄 Versioni Disponibili

1. **Versione Semplice (`index.html`)** - **CONSIGLIATA**
   - ✅ Nessun backend richiesto
   - ✅ Nessuna installazione necessaria
   - ✅ Funziona completamente nel browser
   - ✅ Include bookmarklet per usare su altri siti
   - ⚠️ Può leggere solo cookie accessibili da JavaScript
   - ⚠️ Non può scansionare automaticamente altri domini

2. **Versione Completa (con Backend)**
   - ✅ Scansione automatica con Playwright
   - ✅ Può scansionare qualsiasi URL
   - ✅ Rileva anche cookie HttpOnly
   - ⚠️ Richiede Node.js e dipendenze
   - ⚠️ Più complessa da configurare

