# rs-cookie-scanner

A command-line web cookie scanner written in Rust. Scans websites and analyzes the cookies they set, categorizing them by purpose and identifying third-party cookies.

## Features

- Scans one or more URLs for cookies
- Categorizes cookies as Necessary, Functional, Analytics, Marketing, or Unknown
- Detects third-party cookies
- Reports cookie attributes (Secure, HttpOnly, SameSite)
- Outputs results as human-readable text or JSON

## Usage

```sh
# Scan a single URL
rs-cookie-scanner https://example.com

# Scan multiple URLs
rs-cookie-scanner https://example.com https://another-site.com

# Output as JSON
rs-cookie-scanner --json https://example.com
```

## Building

```sh
cargo build --release
```

## Testing

```sh
cargo test
```
