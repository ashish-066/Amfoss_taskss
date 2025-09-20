const resultsDiv = document.getElementById("results");

// Ask content.js for the latest semantic results
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "getLatestResults" }, (response) => {
    if (!response || !response.results) {
      resultsDiv.innerText = "No results available yet.";
      return;
    }

    resultsDiv.innerHTML = "";
    response.results.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("link-item", item.label.toLowerCase());
      div.innerHTML = `<strong>${item.label}</strong>: <a href="${item.url}" target="_blank">${item.url}</a><br>
                       <small>${item.snippet}</small>`;
      resultsDiv.appendChild(div);
    });
  });
});
