// Initialize the extension
chrome.runtime.onInstalled.addListener(() => {
  // Set up initial rules
  updateBlockingRules();
});

// Listen for storage changes to update rules
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.blockedSites) {
    updateBlockingRules();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateRules") {
    updateBlockingRules();
    sendResponse({ success: true });
  }
});

async function updateBlockingRules() {
  try {
    // Get current blocked sites
    const result = await chrome.storage.sync.get(['blockedSites']);
    const blockedSites = result.blockedSites || [];
    
    console.log('Current blocked sites:', blockedSites);
    
    // Clear existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(rule => rule.id);
    
    console.log('Removing existing rules:', ruleIdsToRemove);
    
    if (ruleIdsToRemove.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove
      });
    }
    
    // Add new rules for each blocked site
    const rulesToAdd = [];
    
    blockedSites.forEach((site, index) => {
      // Clean up the site name - remove protocol if present
      let cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
      
      // Create multiple rules for better coverage
      const siteRules = [
        {
          id: (index * 3) + 1,
          priority: 1,
          action: {
            type: 'redirect',
            redirect: {
              url: 'https://www.google.com/search?q=website+blocked'
            }
          },
          condition: {
            urlFilter: `*://${cleanSite}/*`,
            resourceTypes: ['main_frame']
          }
        },
        {
          id: (index * 3) + 2,
          priority: 1,
          action: {
            type: 'redirect',
            redirect: {
              url: 'https://www.google.com/search?q=website+blocked'
            }
          },
          condition: {
            urlFilter: `*://www.${cleanSite}/*`,
            resourceTypes: ['main_frame']
          }
        },
        {
          id: (index * 3) + 3,
          priority: 1,
          action: {
            type: 'redirect',
            redirect: {
              url: 'https://www.google.com/search?q=website+blocked'
            }
          },
          condition: {
            urlFilter: `*://${cleanSite}`,
            resourceTypes: ['main_frame']
          }
        }
      ];
      
      rulesToAdd.push(...siteRules);
    });
    
    console.log('Adding rules:', rulesToAdd);
    
    if (rulesToAdd.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rulesToAdd
      });
    }
    
    // Verify rules were added
    const newRules = await chrome.declarativeNetRequest.getDynamicRules();
    console.log(`Successfully updated blocking rules. Total rules: ${newRules.length}`);
    console.log('Current dynamic rules:', newRules);
    
  } catch (error) {
    console.error('Error updating blocking rules:', error);
  }
}
