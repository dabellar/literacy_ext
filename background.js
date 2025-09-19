"use strict";
/**
 * @author Darleine Abellard
 * CS 141 - Reader's Aide Chrome Extension
 *
 * The JS file for the service worker for the side panel 
 * of the Reader's Aide chrome extension. 
 * This file handles the API functionality for the side panel.
 */

// global(ish) variables 
let global = {
  PENDING_SEARCH: null,
  OPEN_PANEL: false,
  PERMISSION_TAB_ID: null,
  // Uncomment one of the following pairs to set a default dictionary
  // elementary dictionary
  // MERRIAM_API_URL: "https://www.dictionaryapi.com/api/v3/references/sd2/json/",
  // MERRIAM_API_KEY: "a2c78f74-c5a2-4e4f-9ea3-f5dc1d0f2f86",
  // intermediate dictionary
  MERRIAM_API_URL: "https://www.dictionaryapi.com/api/v3/references/sd3/json/",
  MERRIAM_API_KEY: "af806ea0-a4e2-455a-af67-fee4e96849f0"
};

/**
 * Allows users to open the side panel by clicking on the action toolbar icon
 */
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

/**
 * Create a context menu item for the extension
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "searchReadersAide",
    title: "Search '%s' on Reader's Aide",
    contexts: ["selection"]
  });
});

/**
 * Send the selected text to the side panel for processing
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "searchReadersAide" && info.selectionText) {
    try {
      const word = info.selectionText.trim();
      if (global.OPEN_PANEL) {
        // Try sending directly (works if side panel is already open)
        chrome.runtime.sendMessage({ action: "contextSearch", word });
      } else {
        // The panel is closed and not listening
        global.PENDING_SEARCH = word;
        await chrome.sidePanel.open({ windowId: tab.windowId });
        global.OPEN_PANEL = true;
      }
    } catch (err) {
      console.error("Error opening side panel:", err);
    }
  }
});

/**
 * Listen for messages from the side panel
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkPermission") {
    // Check microphone permission
    navigator.permissions.query({ name: 'microphone' })
        .then(permissionStatus => {
            sendResponse({ status: permissionStatus.state });
        })
        .catch(error => {
            sendResponse({ status: 'error', error: error.message });
        });
    return true; 
  } else if (request.action === "openPermissionTab") {
      // If we already have a permission tab open, focus it instead of creating a new one
      if (global.permissionTabId) {
          chrome.tabs.update(global.permissionTabId, { active: true });
          sendResponse({ tabId: global.permissionTabId });
      } else {
          chrome.tabs.create({ url: chrome.runtime.getURL('requestPermissions/requestPermissions.html') }, (tab) => {
              global.permissionTabId = tab.id;
              sendResponse({ tabId: tab.id });
          });
      }
      return true;
    } else if (request.action === "permissionGranted") {
        // Clear the permission tab ID when permission is granted
        global.permissionTabId = null;
        sendResponse({ success: true });
    } else if (request.action === "defineWord") {
        // Fetch the definition of the word
        fetchDefinition(request.word).then(result => {
            sendResponse(result);
        });
    } else if (request.action === "speakWord" && request.word) {
        // Speak the word using the Text-to-Speech API
          chrome.tts.speak(request.word, {
              rate: 0.6,
              pitch: 1.0,
              lang: "en-US",
              onEvent: (event) => {
                  if (event.type === 'error') {
                      console.error('Speech error:', event.errorMessage);
                  }
              }
          });
          sendResponse({damn: true}); // to stop async error
    } else if (request.action === "getPendingSearch") {
        // Return any pending search term
          sendResponse({ word: global.PENDING_SEARCH });
          global.PENDING_SEARCH = null; // clear once used
      } 
      return true;
});

/** 
 * Track when permission tabs are closed
 */
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === global.permissionTabId) {
        global.permissionTabId = null;
    }
});


/**
 * Fetch the definition of a word from the Free Dictionary API
 * @param {string} word the word to define
 * @returns {Promise<string>} The definition of the word
 */
async function fetchDefinition(word) {
  try {
    word = word.toLowerCase();
    let response = await fetch(`${global.MERRIAM_API_URL}${word}?key=${global.MERRIAM_API_KEY}`);
    let data = await response.json();
    let result = {};
    let tryList = [];
    let sug = "";

    if (data.length === 0) {
      result = { error: "No definitions found." };
    } else {
      // found definitions
      if (typeof data[0] === "object") {
        for (let entry of data) {
          if (!entry.meta.stems.includes(word)) {
            continue;
          }
          let pOS = entry.fl; // part of speech
          if (pOS in result) {
            continue; // only take the first definition per part of speech
          } else if (pOS === "combining form") {
            continue; // not helpful definition
          }
          result[pOS] = entry.shortdef[0];
        }
      } else if (typeof data[0] === "string") { // no definitions found or spelling errors
        tryList = data.slice(0, 6);
        sug = data[0];
      }
      if (Object.keys(result).length === 0) {
        result["error"] = "No definitions found.";
        result["suggestions"] = `did you mean "${sug}"?`;
      }
      return result;
    }
  } catch (err) {
    console.error('Error fetching definition:', err);
    return { error: "Error fetching definition." };
  }
}
