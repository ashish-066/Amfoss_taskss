const siteInput = document.getElementById("siteInput");
const addBtn = document.getElementById("addBtn");
const debugBtn = document.getElementById("debugBtn");
const blockedList = document.getElementById("blockedList");
const debugInfo = document.getElementById("debugInfo");

// Load blocked sites on popup open
chrome.storage.sync.get(["blockedSites"], (result) => {
  const sites = result.blockedSites || [];
  sites.forEach(addSiteToList);
});

// Add new site
addBtn.addEventListener("click", () => {
  const site = siteInput.value.trim();
  if (!site) return;

  chrome.storage.sync.get(["blockedSites"], (result) => {
    const sites = result.blockedSites || [];
    if (!sites.includes(site)) {
      sites.push(site);
      chrome.storage.sync.set({ blockedSites: sites }, () => {
        addSiteToList(site);
        siteInput.value = "";
      });
    }
  });
});

function addSiteToList(site) {
  const li = document.createElement("li");
  li.style.display = "flex";
  li.style.justifyContent = "space-between";
  li.style.alignItems = "center";
  li.style.margin = "5px 0";
  
  const siteText = document.createElement("span");
  siteText.textContent = site;
  
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.style.padding = "2px 8px";
  removeBtn.style.fontSize = "12px";
  removeBtn.style.backgroundColor = "#ff4444";
  removeBtn.style.color = "white";
  removeBtn.style.border = "none";
  removeBtn.style.borderRadius = "3px";
  removeBtn.style.cursor = "pointer";
  
  removeBtn.addEventListener("click", () => {
    removeSite(site);
    li.remove();
  });
  
  li.appendChild(siteText);
  li.appendChild(removeBtn);
  blockedList.appendChild(li);
}

function removeSite(siteToRemove) {
  chrome.storage.sync.get(["blockedSites"], (result) => {
    const sites = result.blockedSites || [];
    const updatedSites = sites.filter(site => site !== siteToRemove);
    chrome.storage.sync.set({ blockedSites: updatedSites });
  });
}

// Debug functionality
debugBtn.addEventListener("click", async () => {
  try {
    // Get current blocked sites
    const result = await chrome.storage.sync.get(["blockedSites"]);
    const blockedSites = result.blockedSites || [];
    
    // Get current dynamic rules
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    
    // Show debug info
    debugInfo.innerHTML = `
      <strong>Debug Info:</strong><br>
      Blocked Sites: ${JSON.stringify(blockedSites)}<br>
      Total Rules: ${rules.length}<br>
      Rules: ${JSON.stringify(rules, null, 2)}
    `;
    debugInfo.style.display = "block";
    
    // Force update rules
    chrome.runtime.sendMessage({ action: "updateRules" });
    
  } catch (error) {
    debugInfo.innerHTML = `<strong>Error:</strong> ${error.message}`;
    debugInfo.style.display = "block";
  }
});
