chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "urlsCaptured") {
        const urls = message.urls; // Process ALL URLs
        console.log("📩 URLs received in background:", urls);

        const results = [];
        const batchSize = 10; // Process 10 URLs at a time
        
        // Process URLs in batches to avoid overwhelming the system
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)}: ${batch.length} URLs`);
            
            // Process batch in parallel
            const batchPromises = batch.map(async (url) => {
                try {
                    // Fetch URL content directly in background script (no CORS issues)
                    const content = await fetchUrlContent(url);
                    
                    if (content) {
                        const semanticData = await getSemanticLabel(content, url);
                        return {
                            url,
                            label: semanticData.label,
                            snippet: semanticData.snippet,
                        };
                    } else {
                        // Fallback: analyze based on URL/domain when content can't be fetched
                        const fallbackData = await getSemanticLabelFromUrl(url);
                        return {
                            url,
                            label: fallbackData.label,
                            snippet: fallbackData.snippet,
                        };
                    }
        } catch (err) {
                    console.error("❌ Failed to process:", url, err);
                    // Fallback: analyze based on URL/domain when content can't be fetched
                    const fallbackData = await getSemanticLabelFromUrl(url);
                    return {
                        url,
                        label: fallbackData.label,
                        snippet: fallbackData.snippet,
                    };
                }
            });
            
            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Send partial results to show progress
            chrome.tabs.sendMessage(sender.tab.id, { type: "semanticResults", results: [...results] });
            
            // Small delay between batches to avoid overwhelming the system
            if (i + batchSize < urls.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        chrome.tabs.sendMessage(sender.tab.id, { type: "semanticResults", results });
    }
});

// Function to fetch URL content in background script (no CORS issues)
async function fetchUrlContent(url) {
    try {
        // Handle mixed content by converting HTTP to HTTPS when possible
        let fetchUrl = url;
        if (url.startsWith('http://')) {
            fetchUrl = url.replace('http://', 'https://');
        }
        
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        
        // Simple text extraction (no DOMParser in service worker)
        const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        return textContent.substring(0, 2000); // Limit to 2000 characters
        
    } catch (error) {
        console.error("Error fetching URL content:", error);
        return null;
    }
}
async function getSemanticLabel(text, url) {
    try {
        // Simple heuristic-based classification
        const content = text.toLowerCase();
        let domain = '';
        
        try {
            domain = new URL(url).hostname.toLowerCase();
        } catch (e) {
            return { label: "Wrong", snippet: "Invalid URL format" };
        }
        
        // Analyze domain structure and patterns
        const isWellKnownDomain = analyzeDomainStructure(domain);
        const isNewsSite = analyzeNewsPatterns(content, domain);
        const hasAdultContent = analyzeAdultContent(content, domain);
        const hasPiracyContent = analyzePiracyContent(content, domain);
        
        // Special handling for sites that can't be fetched
        const isBlockedPiracySite = analyzeBlockedPiracySites(domain);
        
        // Analyze suspicious content
        const hasSuspiciousContent = analyzeSuspiciousContent(content);
        const hasLegitimateContent = analyzeLegitimateContent(content);
        
        let label = "Unknown";
        let snippet = text.substring(0, 200);
        
        // Dynamic classification based on content analysis - be more conservative
        if (isNewsSite) {
            label = "Correct"; // News sites are always legitimate
        } else if (isBlockedPiracySite) {
            label = "Wrong"; // Known piracy sites that block access
        } else if (hasAdultContent) {
            label = "Wrong";
        } else if (hasPiracyContent) {
            label = "Wrong";
        } else if (isWellKnownDomain) {
            label = "Correct";
        } else if (hasLegitimateContent) {
            label = "Correct"; // If it has legitimate content, trust it
        } else if (hasSuspiciousContent && !hasLegitimateContent) {
            label = "Wrong";
        } else {
            // For unknown sites, be more conservative - default to Unknown instead of Wrong
            if (url.includes('http://') || domain.includes('bit.ly') || domain.includes('tinyurl') || domain.includes('t.co')) {
                label = "Wrong";
            } else if (url.includes('https://') && domain.includes('.')) {
                // Default to Unknown for HTTPS sites with proper domains
                label = "Unknown";
            } else {
                label = "Unknown";
            }
        }
        
        return {
            label: label,
            snippet: snippet
        };
    } catch (error) {
        console.error("Error in getSemanticLabel:", error);
        return { label: "Unknown", snippet: "Error analyzing content" };
    }
}

// Dynamic analysis functions
function analyzeDomainStructure(domain) {
    // Check for well-known legitimate domains first
    const wellKnownDomains = [
        /google/i, /wikipedia/i, /github/i, /stackoverflow/i, /reddit/i,
        /youtube/i, /amazon/i, /microsoft/i, /apple/i, /yahoo/i, /bing/i,
        /netflix/i, /spotify/i, /linkedin/i, /twitter/i, /facebook/i, /instagram/i,
        /news18/i, /hindustantimes/i, /zeenews/i, /indianexpress/i, /thehindu/i,
        /ndtv/i, /republicworld/i, /aajtak/i, /abpnews/i, /cnn/i, /bbc/i,
        /reuters/i, /bloomberg/i, /wsj/i, /nytimes/i, /washingtonpost/i,
        /guardian/i, /telegraph/i, /independent/i, /dailymail/i, /mirror/i,
        /edu/i, /gov/i, /mil/i, /org/i, /university/i, /college/i, /school/i,
        /research/i, /academic/i, /institute/i, /foundation/i, /museum/i,
        /roboflow/i, /sketchfab/i, /academia/i, /scholar/i, /arxiv/i
    ];
    
    const isWellKnownDomain = wellKnownDomains.some(pattern => pattern.test(domain));
    if (isWellKnownDomain) {
        return true;
    }
    
    // Check for well-known domain patterns
    const wellKnownPatterns = [
        /^[a-z]+\.(com|org|net|edu|gov|mil)$/i,  // Standard TLDs
        /^[a-z]+\.(co\.uk|com\.au|co\.in|co\.jp)$/i,  // Country-specific TLDs
        /^[a-z]+\.[a-z]+\.[a-z]+$/i  // Multi-level domains
    ];
    
    // Check if domain follows standard patterns
    const hasStandardPattern = wellKnownPatterns.some(pattern => pattern.test(domain));
    
    // Check for suspicious domain characteristics
    const suspiciousPatterns = [
        /^\d+\.\d+\.\d+\.\d+$/,  // IP addresses
        /[^a-z0-9.-]/i,  // Non-standard characters
        /^.{1,3}\./,  // Very short domains
        /\.(tk|ml|ga|cf)$/i  // Free domains
    ];
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(domain));
    
    return hasStandardPattern && !hasSuspiciousPattern;
}

function analyzeNewsPatterns(content, domain) {
    // News site indicators
    const newsIndicators = [
        'news', 'article', 'report', 'breaking', 'headlines', 'journalism',
        'according to', 'sources say', 'officials said', 'police said',
        'government', 'authorities', 'investigation', 'arrest', 'raid',
        'shut down', 'closed', 'banned', 'warning', 'alert', 'crackdown',
        'published', 'reporter', 'correspondent', 'editor', 'byline'
    ];
    
    const newsScore = newsIndicators.reduce((score, indicator) => {
        return score + (content.toLowerCase().includes(indicator) ? 1 : 0);
    }, 0);
    
    // Check for news-like domain patterns
    const newsDomainPatterns = [
        /news/i, /times/i, /post/i, /herald/i, /tribune/i, /gazette/i,
        /chronicle/i, /journal/i, /press/i, /media/i, /tv/i, /channel/i
    ];
    
    const hasNewsDomain = newsDomainPatterns.some(pattern => pattern.test(domain));
    
    return newsScore >= 3 || hasNewsDomain;
}

function analyzeAdultContent(content, domain) {
    // Adult content indicators - more comprehensive list
    const adultIndicators = [
        'porn', 'xxx', 'adult', 'sex', 'nude', 'naked', 'erotic', 'fetish',
        'bdsm', 'cam', 'webcam', 'escort', 'dating', 'hookup', 'milf', 'teen',
        'anal', 'oral', 'blowjob', 'fuck', 'pussy', 'dick', 'cock', 'tits',
        'boobs', 'ass', 'butt', 'pornography', 'sexual', 'intimate', 'horny',
        'sexy', 'hot', 'nude', 'naked', 'strip', 'stripclub', 'brothel',
        'prostitute', 'hooker', 'escort', 'massage', 'parlour', 'adult video',
        'adult film', 'porn video', 'sex video', 'nude video', 'adult content',
        'adult entertainment', 'adult site', 'porn site', 'sex site', 'adult chat',
        'sex chat', 'adult dating', 'sex dating', 'adult friend', 'sex friend'
    ];
    
    const adultScore = adultIndicators.reduce((score, indicator) => {
        return score + (content.toLowerCase().includes(indicator) ? 1 : 0);
    }, 0);
    
    // Check for adult-like domain patterns - more comprehensive
    const adultDomainPatterns = [
        /porn/i, /xxx/i, /adult/i, /sex/i, /nude/i, /naked/i, /erotic/i,
        /fetish/i, /bdsm/i, /cam/i, /webcam/i, /escort/i, /dating/i,
        /hookup/i, /milf/i, /teen/i, /anal/i, /oral/i, /blowjob/i,
        /fuck/i, /pussy/i, /dick/i, /cock/i, /tits/i, /boobs/i, /ass/i,
        /butt/i, /pornography/i, /sexual/i, /intimate/i, /horny/i, /sexy/i,
        /hot/i, /strip/i, /stripclub/i, /brothel/i, /prostitute/i, /hooker/i,
        /massage/i, /parlour/i, /adultvideo/i, /adultfilm/i, /pornvideo/i,
        /sexvideo/i, /nudevideo/i, /adultcontent/i, /adultentertainment/i,
        /adultsite/i, /pornsite/i, /sexsite/i, /adultchat/i, /sexchat/i,
        /adultdating/i, /sexdating/i, /adultfriend/i, /sexfriend/i
    ];
    
    const hasAdultDomain = adultDomainPatterns.some(pattern => pattern.test(domain));
    
    // Lower threshold for adult content detection
    return adultScore >= 1 || hasAdultDomain;
}

function analyzePiracyContent(content, domain) {
    // Piracy content indicators
    const piracyIndicators = [
        'torrent', 'download', 'free movie', 'free tv show', 'streaming',
        'watch online', 'hd quality', 'bluray', 'dvdrip', 'camrip', 'hdcam',
        'free download', 'movie download', 'tv show download', 'series download',
        'film download', 'pirate', 'piracy', 'illegal', 'unauthorized',
        'copyright infringement', 'dmca', 'cease and desist'
    ];
    
    const piracyScore = piracyIndicators.reduce((score, indicator) => {
        return score + (content.toLowerCase().includes(indicator) ? 1 : 0);
    }, 0);
    
    // Check for piracy-like domain patterns
    const piracyDomainPatterns = [
        /torrent/i, /pirate/i, /free/i, /download/i, /stream/i, /watch/i,
        /movie/i, /film/i, /tv/i, /series/i, /episode/i
    ];
    
    const hasPiracyDomain = piracyDomainPatterns.some(pattern => pattern.test(domain));
    
    // But exclude news articles about piracy
    const newsIndicators = [
        'news', 'article', 'report', 'according to', 'sources say',
        'officials said', 'police said', 'government', 'authorities',
        'investigation', 'arrest', 'raid', 'shut down', 'closed', 'banned'
    ];
    
    const isNewsArticle = newsIndicators.some(indicator => 
        content.toLowerCase().includes(indicator)
    );
    
    return (piracyScore >= 2 || hasPiracyDomain) && !isNewsArticle;
}

function analyzeSuspiciousContent(content) {
    // Suspicious content indicators
    const suspiciousIndicators = [
        'phishing', 'scam', 'fraud', 'malware', 'virus', 'hack', 'steal',
        'password', 'credit card', 'bitcoin', 'crypto', 'investment',
        'free money', 'click here', 'urgent', 'act now', 'lottery', 'winner',
        'congratulations', 'you won', 'claim now', 'limited time', 'exclusive offer',
        'verify account', 'suspended', 'expired', 'update now', 'click to continue'
    ];
    
    const suspiciousScore = suspiciousIndicators.reduce((score, indicator) => {
        return score + (content.toLowerCase().includes(indicator) ? 1 : 0);
    }, 0);
    
    return suspiciousScore >= 2;
}

function analyzeLegitimateContent(content) {
    // Legitimate content indicators
    const legitimateIndicators = [
        'about us', 'contact', 'privacy policy', 'terms of service', 'news',
        'article', 'blog', 'support', 'help', 'home', 'services', 'products',
        'company', 'business', 'official', 'copyright', 'all rights reserved',
        'customer service', 'faq', 'help center', 'contact us', 'about',
        'mission', 'vision', 'team', 'careers', 'jobs', 'press', 'media'
    ];
    
    const legitimateScore = legitimateIndicators.reduce((score, indicator) => {
        return score + (content.toLowerCase().includes(indicator) ? 1 : 0);
    }, 0);
    
    return legitimateScore >= 2;
}

function analyzeBlockedPiracySites(domain) {
    // Known piracy sites that often block access or are hard to fetch
    const blockedPiracyPatterns = [
        /bappam/i,
        /ibomma/i,
        /movierulz/i,
        /tamilrockers/i,
        /filmywap/i,
        /filmyzilla/i,
        /bollyflix/i,
        /moviesflix/i,
        /worldfree4u/i,
        /khatrimaza/i,
        /pagalworld/i,
        /mp4moviez/i,
        /filmyhit/i,
        /skymovieshd/i,
        /moviescounter/i,
        /extramovies/i,
        /9xmovies/i,
        /coolmoviez/i,
        /moviezwap/i,
        /filmy4wap/i,
        /hdmoviesflix/i,
        /moviesflixpro/i,
        /filmygod/i,
        /moviesflixhd/i,
        /tamilyogi/i,
        /isaimini/i,
        /tamilgun/i,
        /moviesda/i,
        /tamilmv/i,
        /thepiratebay/i,
        /1337x/i,
        /rarbg/i,
        /yts/i,
        /eztv/i
    ];
    
    return blockedPiracyPatterns.some(pattern => pattern.test(domain));
}

// Fallback function when content cannot be fetched
async function getSemanticLabelFromUrl(url) {
    try {
        let domain = '';
        try {
            domain = new URL(url).hostname.toLowerCase();
        } catch (e) {
            return { label: "Wrong", snippet: "Invalid URL format" };
        }
        
        // Use the blocked piracy site detection
        const isBlockedPiracySite = analyzeBlockedPiracySites(domain);
        
        if (isBlockedPiracySite) {
            return { label: "Wrong", snippet: "Known piracy site (content blocked)" };
        }
        
        // Check for other patterns
        const isNewsSite = analyzeNewsPatterns("", domain); // Empty content, domain only
        const hasAdultContent = analyzeAdultContent("", domain); // Empty content, domain only
        const isWellKnownDomain = analyzeDomainStructure(domain);
        
        if (isNewsSite) {
            return { label: "Correct", snippet: "News site (content blocked)" };
        } else if (hasAdultContent) {
            return { label: "Wrong", snippet: "Adult content site (content blocked)" };
        } else if (isWellKnownDomain) {
            return { label: "Correct", snippet: "Well-known site (content blocked)" };
        } else {
            return { label: "Unknown", snippet: "Content could not be fetched" };
        }
        
    } catch (error) {
        console.error("Error in getSemanticLabelFromUrl:", error);
        return { label: "Unknown", snippet: "Error analyzing URL" };
    }
}
  