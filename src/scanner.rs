use reqwest::header::{HeaderMap, HeaderValue, SET_COOKIE};
use url::Url;

use crate::cookie_info::{CookieCategory, CookieInfo, SameSitePolicy};
use crate::error::ScanError;

/// Scans a URL and returns information about all cookies set by the response.
pub async fn scan_url(url: &str) -> Result<Vec<CookieInfo>, ScanError> {
    let parsed_url = Url::parse(url)?;
    let domain = parsed_url
        .host_str()
        .ok_or_else(|| ScanError::InvalidUrl("URL has no host".to_string()))?
        .to_string();

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()?;

    let response = client.get(url).send().await?;
    let headers = response.headers().clone();

    let cookies = parse_set_cookie_headers(&headers, &domain);
    Ok(cookies)
}

/// Parses Set-Cookie headers from an HTTP response into structured cookie information.
fn parse_set_cookie_headers(headers: &HeaderMap, domain: &str) -> Vec<CookieInfo> {
    headers
        .get_all(SET_COOKIE)
        .iter()
        .filter_map(|value| parse_single_cookie(value, domain))
        .collect()
}

/// Parses a single Set-Cookie header value into a CookieInfo struct.
fn parse_single_cookie(header_value: &HeaderValue, domain: &str) -> Option<CookieInfo> {
    let cookie_str = header_value.to_str().ok()?;
    let parsed = cookie::Cookie::parse(cookie_str).ok()?;

    let name = parsed.name().to_string();
    let value = parsed.value().to_string();
    let cookie_domain = parsed
        .domain()
        .map(|d| d.to_string())
        .unwrap_or_else(|| domain.to_string());
    let path = parsed.path().map(|p| p.to_string()).unwrap_or_default();
    let secure = parsed.secure().unwrap_or(false);
    let http_only = parsed.http_only().unwrap_or(false);
    let same_site = parsed
        .same_site()
        .map(SameSitePolicy::from)
        .unwrap_or(SameSitePolicy::Unset);

    let is_third_party = is_cookie_third_party(&cookie_domain, domain);
    let category = classify_cookie(&name);

    Some(CookieInfo {
        name,
        value,
        domain: cookie_domain,
        path,
        secure,
        http_only,
        same_site,
        is_third_party,
        category,
    })
}

/// Determines if a cookie is third-party based on its domain.
fn is_cookie_third_party(cookie_domain: &str, page_domain: &str) -> bool {
    let cookie_d = cookie_domain.trim_start_matches('.');
    let page_d = page_domain.trim_start_matches('.');

    if cookie_d == page_d {
        return false;
    }

    // Check if cookie domain is a parent of the page domain
    if page_d.ends_with(&format!(".{cookie_d}")) {
        return false;
    }

    // Check if page domain is a parent of the cookie domain
    if cookie_d.ends_with(&format!(".{page_d}")) {
        return false;
    }

    true
}

/// Classifies a cookie based on its name using common naming patterns.
pub fn classify_cookie(name: &str) -> CookieCategory {
    let lower_name = name.to_lowercase();

    // Analytics cookies
    if lower_name.starts_with("_ga")
        || lower_name.starts_with("_gid")
        || lower_name.starts_with("_gat")
        || lower_name.contains("analytics")
        || lower_name.contains("_utm")
        || lower_name.starts_with("__utm")
        || lower_name == "_hjid"
        || lower_name.starts_with("_hj")
    {
        return CookieCategory::Analytics;
    }

    // Marketing / advertising cookies
    if lower_name.starts_with("_fbp")
        || lower_name.starts_with("_fbc")
        || lower_name.contains("ads")
        || lower_name.contains("advert")
        || lower_name.contains("doubleclick")
        || lower_name.starts_with("_gcl")
        || lower_name == "fr"
        || lower_name == "ide"
        || lower_name.contains("marketing")
    {
        return CookieCategory::Marketing;
    }

    // Functional cookies
    if lower_name.contains("lang")
        || lower_name.contains("locale")
        || lower_name.contains("pref")
        || lower_name.contains("theme")
        || lower_name.contains("timezone")
        || lower_name.contains("currency")
    {
        return CookieCategory::Functional;
    }

    // Necessary cookies
    if lower_name.contains("session")
        || lower_name.contains("csrf")
        || lower_name.contains("xsrf")
        || lower_name.contains("token")
        || lower_name.contains("auth")
        || lower_name.contains("consent")
        || lower_name.contains("cookie_policy")
        || lower_name == "__cfduid"
        || lower_name.starts_with("__cf")
    {
        return CookieCategory::Necessary;
    }

    CookieCategory::Unknown
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_analytics_cookies() {
        assert_eq!(classify_cookie("_ga"), CookieCategory::Analytics);
        assert_eq!(classify_cookie("_gid"), CookieCategory::Analytics);
        assert_eq!(classify_cookie("_gat_gtag"), CookieCategory::Analytics);
        assert_eq!(classify_cookie("__utma"), CookieCategory::Analytics);
        assert_eq!(classify_cookie("_hjid"), CookieCategory::Analytics);
        assert_eq!(
            classify_cookie("my_analytics_id"),
            CookieCategory::Analytics
        );
    }

    #[test]
    fn test_classify_marketing_cookies() {
        assert_eq!(classify_cookie("_fbp"), CookieCategory::Marketing);
        assert_eq!(classify_cookie("_fbc"), CookieCategory::Marketing);
        assert_eq!(classify_cookie("_gcl_au"), CookieCategory::Marketing);
        assert_eq!(classify_cookie("fr"), CookieCategory::Marketing);
        assert_eq!(classify_cookie("ide"), CookieCategory::Marketing);
    }

    #[test]
    fn test_classify_functional_cookies() {
        assert_eq!(classify_cookie("lang"), CookieCategory::Functional);
        assert_eq!(classify_cookie("locale"), CookieCategory::Functional);
        assert_eq!(classify_cookie("user_pref"), CookieCategory::Functional);
        assert_eq!(classify_cookie("theme"), CookieCategory::Functional);
    }

    #[test]
    fn test_classify_necessary_cookies() {
        assert_eq!(classify_cookie("session_id"), CookieCategory::Necessary);
        assert_eq!(classify_cookie("csrf_token"), CookieCategory::Necessary);
        assert_eq!(classify_cookie("XSRF-TOKEN"), CookieCategory::Necessary);
        assert_eq!(classify_cookie("auth_key"), CookieCategory::Necessary);
    }

    #[test]
    fn test_classify_unknown_cookies() {
        assert_eq!(classify_cookie("random_cookie"), CookieCategory::Unknown);
        assert_eq!(classify_cookie("xyz"), CookieCategory::Unknown);
    }

    #[test]
    fn test_is_cookie_third_party() {
        // Same domain
        assert!(!is_cookie_third_party("example.com", "example.com"));

        // Subdomain of page domain
        assert!(!is_cookie_third_party(".example.com", "www.example.com"));

        // Cookie domain is parent of page domain
        assert!(!is_cookie_third_party("example.com", "sub.example.com"));

        // Different domain = third party
        assert!(is_cookie_third_party("tracker.com", "example.com"));
        assert!(is_cookie_third_party("ads.other.com", "example.com"));
    }

    #[test]
    fn test_parse_set_cookie_headers() {
        let mut headers = HeaderMap::new();
        headers.append(
            SET_COOKIE,
            HeaderValue::from_static("_ga=GA1.2.123; Domain=.example.com; Path=/; Secure"),
        );
        headers.append(
            SET_COOKIE,
            HeaderValue::from_static("session_id=abc123; Path=/; HttpOnly"),
        );

        let cookies = parse_set_cookie_headers(&headers, "example.com");
        assert_eq!(cookies.len(), 2);

        assert_eq!(cookies[0].name, "_ga");
        assert!(cookies[0].secure);
        assert_eq!(cookies[0].category, CookieCategory::Analytics);

        assert_eq!(cookies[1].name, "session_id");
        assert!(cookies[1].http_only);
        assert_eq!(cookies[1].category, CookieCategory::Necessary);
    }
}
