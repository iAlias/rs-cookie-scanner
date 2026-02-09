use thiserror::Error;

/// Errors that can occur during cookie scanning.
#[derive(Error, Debug)]
pub enum ScanError {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    #[error("Invalid URL: {0}")]
    InvalidUrl(String),

    #[error("URL parse error: {0}")]
    UrlParseError(#[from] url::ParseError),

    #[error("JSON serialization error: {0}")]
    JsonError(#[from] serde_json::Error),
}
