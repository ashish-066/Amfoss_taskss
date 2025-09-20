// Grab all links on the page, but exclude Google's own elements
const links = Array.from(document.querySelectorAll('a'))
  .map(a => a.href)
  .filter(href => {
    // Only process external links, not Google's own navigation/UI
    return href.startsWith('http') && 
           !href.includes('mcafee') &&
           !href.includes('google.com') &&
           !href.includes('googleusercontent.com') &&
           !href.includes('gstatic.com') &&
           !href.includes('googleapis.com') &&
           !href.includes('youtube.com') && // YouTube is generally safe
           !href.includes('wikipedia.org'); // Wikipedia is generally safe
  });

console.log("🔗 Found", links.length, "filtered links");


// Send URLs to background for processing
chrome.runtime.sendMessage({ type: "urlsCaptured", urls: links }, () => {
  if (chrome.runtime.lastError) {
    console.warn("Message send error (ignored):", chrome.runtime.lastError.message);
  }
});

// Listen for results from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "semanticResults") {
    console.log("📊 Semantic results received:", message.results.length, "results");
    displayResults(message.results);
  }
});

// Function to add symbols next to links in search results
function displayResults(results) {
  console.log("📊 Adding symbols to links:", results.length, "results");
  
  // Remove loading indicators
  const loadingIndicators = document.querySelectorAll('.safety-loading');
  loadingIndicators.forEach(indicator => indicator.remove());
  
  results.forEach(result => {
    // Find all links on the page that match this URL
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      if (link.href === result.url) {
        // Remove any existing symbols or loading indicators
        const existingSymbol = link.parentNode.querySelector('.safety-symbol, .safety-loading');
        if (existingSymbol) {
          existingSymbol.remove();
        }
        
        // Create symbol element
        const symbol = document.createElement('span');
        symbol.className = 'safety-symbol';
        symbol.style.marginLeft = '8px';
        symbol.style.fontSize = '18px';
        symbol.style.fontWeight = 'bold';
        symbol.style.display = 'inline-block';
        symbol.style.verticalAlign = 'middle';
        symbol.style.cursor = 'help';
        symbol.title = `Safety: ${result.label} - ${result.snippet}`;
        
        // Set symbol based on classification
        if (result.label === "Wrong") {
          symbol.textContent = '❌';
          symbol.style.color = '#d32f2f'; // Red
        } else if (result.label === "Unknown") {
          symbol.textContent = '⚠️';
          symbol.style.color = '#f57c00'; // Orange
        } else if (result.label === "Correct") {
          symbol.textContent = '✅';
          symbol.style.color = '#388e3c'; // Green
        }
        
        // Insert symbol after the link
        link.parentNode.insertBefore(symbol, link.nextSibling);
        
        console.log(`✅ Added ${symbol.textContent} to ${result.url}`);
      }
    });
  });
  
  // Add loading indicators to links that haven't been processed yet
  addLoadingIndicators(results);
}

// Function to add loading indicators to unprocessed links
function addLoadingIndicators(processedResults) {
  const allLinks = document.querySelectorAll('a[href]');
  const processedUrls = new Set(processedResults.map(r => r.url));
  
  allLinks.forEach(link => {
    if (link.href && !processedUrls.has(link.href) && !link.parentNode.querySelector('.safety-symbol, .safety-loading')) {
      // Don't show loading indicators for Google's own elements
      if (isGoogleElement(link.href)) {
        return; // Skip Google elements
      }
      
      // Add loading indicator
      const loading = document.createElement('span');
      loading.className = 'safety-loading';
      loading.textContent = '⏳';
      loading.style.marginLeft = '8px';
      loading.style.fontSize = '16px';
      loading.style.color = '#666';
      loading.title = 'Analyzing safety...';
      
      link.parentNode.insertBefore(loading, link.nextSibling);
    }
  });
}

// Function to check if a URL is a Google element that should be ignored
function isGoogleElement(url) {
  const googleDomains = [
    'google.com', 'googleusercontent.com', 'gstatic.com', 'googleapis.com',
    'youtube.com', 'wikipedia.org', 'google.co.in', 'google.co.uk',
    'google.ca', 'google.com.au', 'google.de', 'google.fr'
  ];
  
  return googleDomains.some(domain => url.includes(domain));
}
