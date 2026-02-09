use serde::Serialize;
use std::fmt;

/// Represents the SameSite policy of a cookie.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub enum SameSitePolicy {
    Strict,
    Lax,
    None,
    Unset,
}

impl From<cookie::SameSite> for SameSitePolicy {
    fn from(ss: cookie::SameSite) -> Self {
        match ss {
            cookie::SameSite::Strict => SameSitePolicy::Strict,
            cookie::SameSite::Lax => SameSitePolicy::Lax,
            cookie::SameSite::None => SameSitePolicy::None,
        }
    }
}

impl fmt::Display for SameSitePolicy {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SameSitePolicy::Strict => write!(f, "Strict"),
            SameSitePolicy::Lax => write!(f, "Lax"),
            SameSitePolicy::None => write!(f, "None"),
            SameSitePolicy::Unset => write!(f, "Unset"),
        }
    }
}

/// Categorizes cookies by their purpose.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub enum CookieCategory {
    Necessary,
    Functional,
    Analytics,
    Marketing,
    Unknown,
}

impl fmt::Display for CookieCategory {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CookieCategory::Necessary => write!(f, "Necessary"),
            CookieCategory::Functional => write!(f, "Functional"),
            CookieCategory::Analytics => write!(f, "Analytics"),
            CookieCategory::Marketing => write!(f, "Marketing"),
            CookieCategory::Unknown => write!(f, "Unknown"),
        }
    }
}

/// Detailed information about a single cookie.
#[derive(Debug, Clone, Serialize)]
pub struct CookieInfo {
    pub name: String,
    pub value: String,
    pub domain: String,
    pub path: String,
    pub secure: bool,
    pub http_only: bool,
    pub same_site: SameSitePolicy,
    pub is_third_party: bool,
    pub category: CookieCategory,
}

impl fmt::Display for CookieInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "  Name:          {}", self.name)?;
        writeln!(f, "  Domain:        {}", self.domain)?;
        writeln!(f, "  Path:          {}", self.path)?;
        writeln!(f, "  Secure:        {}", self.secure)?;
        writeln!(f, "  HttpOnly:      {}", self.http_only)?;
        writeln!(f, "  SameSite:      {}", self.same_site)?;
        writeln!(f, "  Third-party:   {}", self.is_third_party)?;
        writeln!(f, "  Category:      {}", self.category)
    }
}

/// Summary of a scan result for a single URL.
#[derive(Debug, Clone, Serialize)]
pub struct ScanResult {
    pub url: String,
    pub cookies: Vec<CookieInfo>,
    pub total_cookies: usize,
    pub third_party_count: usize,
    pub category_summary: CategorySummary,
}

/// Count of cookies per category.
#[derive(Debug, Clone, Serialize)]
pub struct CategorySummary {
    pub necessary: usize,
    pub functional: usize,
    pub analytics: usize,
    pub marketing: usize,
    pub unknown: usize,
}

impl ScanResult {
    pub fn new(url: String, cookies: Vec<CookieInfo>) -> Self {
        let total_cookies = cookies.len();
        let third_party_count = cookies.iter().filter(|c| c.is_third_party).count();
        let category_summary = CategorySummary {
            necessary: cookies
                .iter()
                .filter(|c| c.category == CookieCategory::Necessary)
                .count(),
            functional: cookies
                .iter()
                .filter(|c| c.category == CookieCategory::Functional)
                .count(),
            analytics: cookies
                .iter()
                .filter(|c| c.category == CookieCategory::Analytics)
                .count(),
            marketing: cookies
                .iter()
                .filter(|c| c.category == CookieCategory::Marketing)
                .count(),
            unknown: cookies
                .iter()
                .filter(|c| c.category == CookieCategory::Unknown)
                .count(),
        };

        ScanResult {
            url,
            cookies,
            total_cookies,
            third_party_count,
            category_summary,
        }
    }
}

impl fmt::Display for ScanResult {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "Scan Results for: {}", self.url)?;
        writeln!(f, "{}", "=".repeat(60))?;
        writeln!(f, "Total cookies:    {}", self.total_cookies)?;
        writeln!(f, "Third-party:      {}", self.third_party_count)?;
        writeln!(f)?;
        writeln!(f, "Category Breakdown:")?;
        writeln!(f, "  Necessary:      {}", self.category_summary.necessary)?;
        writeln!(f, "  Functional:     {}", self.category_summary.functional)?;
        writeln!(f, "  Analytics:      {}", self.category_summary.analytics)?;
        writeln!(f, "  Marketing:      {}", self.category_summary.marketing)?;
        writeln!(f, "  Unknown:        {}", self.category_summary.unknown)?;

        if !self.cookies.is_empty() {
            writeln!(f)?;
            writeln!(f, "Cookie Details:")?;
            writeln!(f, "{}", "-".repeat(60))?;
            for (i, cookie) in self.cookies.iter().enumerate() {
                writeln!(f, "Cookie #{}:", i + 1)?;
                write!(f, "{cookie}")?;
                writeln!(f, "{}", "-".repeat(60))?;
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_result_summary() {
        let cookies = vec![
            CookieInfo {
                name: "_ga".to_string(),
                value: "GA1.2.123".to_string(),
                domain: ".example.com".to_string(),
                path: "/".to_string(),
                secure: true,
                http_only: false,
                same_site: SameSitePolicy::Lax,
                is_third_party: false,
                category: CookieCategory::Analytics,
            },
            CookieInfo {
                name: "session_id".to_string(),
                value: "abc123".to_string(),
                domain: "example.com".to_string(),
                path: "/".to_string(),
                secure: true,
                http_only: true,
                same_site: SameSitePolicy::Strict,
                is_third_party: false,
                category: CookieCategory::Necessary,
            },
        ];

        let result = ScanResult::new("https://example.com".to_string(), cookies);

        assert_eq!(result.total_cookies, 2);
        assert_eq!(result.third_party_count, 0);
        assert_eq!(result.category_summary.analytics, 1);
        assert_eq!(result.category_summary.necessary, 1);
        assert_eq!(result.category_summary.functional, 0);
        assert_eq!(result.category_summary.marketing, 0);
        assert_eq!(result.category_summary.unknown, 0);
    }

    #[test]
    fn test_same_site_display() {
        assert_eq!(SameSitePolicy::Strict.to_string(), "Strict");
        assert_eq!(SameSitePolicy::Lax.to_string(), "Lax");
        assert_eq!(SameSitePolicy::None.to_string(), "None");
        assert_eq!(SameSitePolicy::Unset.to_string(), "Unset");
    }

    #[test]
    fn test_category_display() {
        assert_eq!(CookieCategory::Necessary.to_string(), "Necessary");
        assert_eq!(CookieCategory::Functional.to_string(), "Functional");
        assert_eq!(CookieCategory::Analytics.to_string(), "Analytics");
        assert_eq!(CookieCategory::Marketing.to_string(), "Marketing");
        assert_eq!(CookieCategory::Unknown.to_string(), "Unknown");
    }
}
