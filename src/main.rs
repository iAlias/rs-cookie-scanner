use clap::Parser;
use rs_cookie_scanner::cookie_info::ScanResult;
use rs_cookie_scanner::scanner::scan_url;

/// A web cookie scanner that analyzes cookies set by websites
#[derive(Parser, Debug)]
#[command(author, version, about)]
struct Args {
    /// URLs to scan for cookies
    #[arg(required = true)]
    urls: Vec<String>,

    /// Output results as JSON
    #[arg(short, long)]
    json: bool,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    let mut results: Vec<ScanResult> = Vec::new();

    for url in &args.urls {
        let url = if !url.starts_with("http://") && !url.starts_with("https://") {
            format!("https://{url}")
        } else {
            url.clone()
        };

        match scan_url(&url).await {
            Ok(cookies) => {
                let result = ScanResult::new(url, cookies);
                results.push(result);
            }
            Err(e) => {
                eprintln!("Error scanning {url}: {e}");
            }
        }
    }

    if args.json {
        match serde_json::to_string_pretty(&results) {
            Ok(json) => println!("{json}"),
            Err(e) => eprintln!("Error serializing results: {e}"),
        }
    } else {
        for result in &results {
            println!("{result}");
        }
    }
}
