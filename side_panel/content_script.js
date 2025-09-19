"use strict";
/**
 * @author Darleine Abellard
 * CS 141 - Reader's Aide Chrome Extension
 *
 * This is the content script for the Reader's Aide Chrome Extension.
 * It handles communication between the content script and the background script.
 *          "chrome.runtime.sendMessage"
 */

/**
 * Get the definitions of a word from the input field
 */
function getDefinition() {
    const word = document.getElementById("word-input").value.trim();
    if (!word) return;

    chrome.runtime.sendMessage({ action: "defineWord", word: word}, 
        (response) => {
            if (response) {
                removeDefinition();
                removeFeedback();
                for (let pOS in response) {
                    let defObj = genDefinition(pOS, response[pOS]);
                    document.getElementById("ra-definition-bucket").appendChild(defObj);
                }
                document.getElementById("ra-definition-bucket").classList.remove("hidden");
                document.getElementById("ra-result").classList.remove("hidden");
            }
        }
    );
}

/**
 * Context menu search if the side panel is closed 
 */
function getPendingSearch() {
    chrome.runtime.sendMessage({ action: "getPendingSearch" }, (response) => {
        if (response && response.word) {
            document.getElementById("word-input").value = response.word;
            getDefinition();
        }
    });
}

/**
 * Send a message to the background script to hear the word out loud
 * @param {string} word word being defined
 */
function sendSpeakWord(word) {
    chrome.runtime.sendMessage({ action: "speakWord", word: word });
}

/**
 * Send a message to the background script to check for permissions
 */
async function sendCheckPermission() {
    return await chrome.runtime.sendMessage({ action: "checkPermission" });
}

/**
 * Send a message to the background script to focus on the mic html page
 */
async function sendRequestMicPermission() {
    return await chrome.runtime.sendMessage({ action: "openPermissionTab" });
}

